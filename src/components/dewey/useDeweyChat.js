/**
 * useDeweyChat.js
 *
 * Encapsulates Dewey chat/onboarding state transitions.
 */

import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import {
	FIRST_OPEN_MESSAGE,
	NO_AI_MESSAGE,
	STARTER_ACTIONS,
	STORAGE_KEYS,
	getSpeechText,
} from './copy';
import { useDewey } from './useDewey';

const MAX_INPUT_CHARS = 500;
const MAX_MESSAGES = 80;
const SUBMIT_THROTTLE_MS = 800;
const CONTROL_CHARS_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const REQUEST_TIMEOUT_MS = 30000;

export function getInitialOpenState() {
	try {
		return ! window.localStorage.getItem( STORAGE_KEYS.openedOnce );
	} catch ( e ) {
		return true;
	}
}

export function detectAiConnection() {
	// deweyConfig is injected via wp_add_inline_script + wp_json_encode, so
	// aiConnected arrives as a real JSON boolean, not the "1"/"" strings that
	// wp_localize_script would produce.
	return Boolean( window.deweyConfig?.aiConnected );
}

export async function detectAiConnectionAsync() {
	const localized = detectAiConnection();
	const aiClient = window.wp?.aiClient;

	if ( ! aiClient || typeof aiClient.prompt !== 'function' ) {
		return localized;
	}

	try {
		const prompt = aiClient.prompt( 'Connection check' );
		if ( typeof prompt?.isSupportedForTextGeneration !== 'function' ) {
			return localized;
		}

		const supported = await prompt.isSupportedForTextGeneration();
		return Boolean( supported ) || localized;
	} catch ( e ) {
		return localized;
	}
}

function createMessage( role, text, extra = {} ) {
	return {
		id: `${ role }-${ Date.now() }-${ Math.random()
			.toString( 36 )
			.slice( 2 ) }`,
		role,
		text,
		...extra,
	};
}

function createWelcomeMessage() {
	return createMessage( 'assistant', FIRST_OPEN_MESSAGE, {
		id: 'welcome',
		actions: STARTER_ACTIONS,
	} );
}

function getApiConfig() {
	const restBase = window.deweyConfig?.restBase;

	if ( typeof restBase !== 'string' || restBase.trim() === '' ) {
		return null;
	}
	const nonce = window.deweyConfig?.nonce;

	return {
		restBase: restBase.replace( /\/+$/, '' ),
		nonce: typeof nonce === 'string' ? nonce : '',
	};
}

async function callDeweyApi( path, payload = null ) {
	const config = getApiConfig();
	if ( ! config ) {
		throw new Error( 'Dewey REST base URL is missing.' );
	}

	const signal =
		typeof AbortSignal !== 'undefined' &&
		typeof AbortSignal.timeout === 'function'
			? AbortSignal.timeout( REQUEST_TIMEOUT_MS )
			: undefined;

	const response = await window.fetch( `${ config.restBase }${ path }`, {
		method: payload ? 'POST' : 'GET',
		credentials: 'same-origin',
		headers: {
			'Content-Type': 'application/json',
			'X-WP-Nonce': config.nonce,
		},
		body: payload ? JSON.stringify( payload ) : undefined,
		signal,
	} );

	const body = await response.json().catch( () => ( {} ) );
	if ( ! response.ok ) {
		throw new Error(
			typeof body?.message === 'string' && body.message
				? body.message
				: `Request failed (${ response.status })`
		);
	}

	return body;
}

function normalizeCitations( citations ) {
	if ( ! Array.isArray( citations ) ) {
		return [];
	}

	return citations
		.filter( ( citation ) => citation && typeof citation === 'object' )
		.map( ( citation ) => ( {
			postId: Number( citation.post_id || 0 ),
			title: String( citation.title || '' ),
			permalink: String( citation.permalink || '' ),
			snippet: String( citation.snippet || '' ),
		} ) )
		.filter( ( citation ) => citation.postId > 0 && citation.title );
}

function normalizeUserInput( value ) {
	if ( typeof value !== 'string' ) {
		return '';
	}

	return value.replace( CONTROL_CHARS_RE, '' ).slice( 0, MAX_INPUT_CHARS );
}

function isValidStarterAction( action ) {
	if ( ! action || typeof action !== 'object' ) {
		return false;
	}

	return STARTER_ACTIONS.some( ( known ) => known.id === action.id );
}

export function useDeweyChat() {
	const isFirstOpen = useMemo( () => getInitialOpenState(), [] );
	const [ isOpen, setIsOpen ] = useState( isFirstOpen );
	const [ inputValue, setInputValue ] = useState( '' );
	const [ messages, setMessages ] = useState( () => [
		createWelcomeMessage(),
	] );
	const [ hasAskedStarter, setHasAskedStarter ] = useState( false );
	const [ isSubmitting, setIsSubmitting ] = useState( false );
	const [ isAiConnected, setIsAiConnected ] = useState( () =>
		detectAiConnection()
	);
	const inputRef = useRef( null );
	const lastSubmitAtRef = useRef( 0 );
	const { deweyState, deweyHandlers } = useDewey();
	const { onFirstOpen } = deweyHandlers;

	useEffect( () => {
		if ( ! isFirstOpen ) {
			return;
		}

		onFirstOpen();
		try {
			window.localStorage.setItem( STORAGE_KEYS.openedOnce, '1' );
		} catch ( e ) {
			// Ignore private mode/localStorage access errors.
		}
	}, [ isFirstOpen, onFirstOpen ] );

	useEffect( () => {
		// Re-read deweyConfig on focus/visibility so that if the user opens
		// Settings → Connectors in another tab and connects a key, then returns,
		// we pick up a page reload which refreshes the PHP-injected value.
		let isActive = true;
		const refreshConnection = () => {
			const aiClient = window.wp?.aiClient;
			if ( ! aiClient || typeof aiClient.prompt !== 'function' ) {
				setIsAiConnected( detectAiConnection() );
				return;
			}

			void detectAiConnectionAsync().then( ( next ) => {
				if ( isActive ) {
					setIsAiConnected( next );
				}
			} );
		};

		refreshConnection();
		const onRefresh = () => {
			refreshConnection();
		};
		window.addEventListener( 'focus', onRefresh );
		document.addEventListener( 'visibilitychange', onRefresh );

		return () => {
			isActive = false;
			window.removeEventListener( 'focus', onRefresh );
			document.removeEventListener( 'visibilitychange', onRefresh );
		};
	}, [] );

	const speech = useMemo(
		() => getSpeechText( deweyState, isAiConnected ),
		[ deweyState, isAiConnected ]
	);

	const addMessage = useCallback( ( role, text, extra = {} ) => {
		setMessages( ( current ) => {
			const next = [ ...current, createMessage( role, text, extra ) ];
			if ( next.length <= MAX_MESSAGES ) {
				return next;
			}

			const [ welcomeMessage ] = next;
			const tail = next.slice( next.length - ( MAX_MESSAGES - 1 ) );
			return [ welcomeMessage, ...tail ];
		} );
	}, [] );

	const openPanel = useCallback( () => {
		setIsOpen( true );
		setTimeout( () => inputRef.current?.focus(), 0 );
	}, [] );

	const closePanel = useCallback( () => {
		setIsOpen( false );
	}, [] );

	const togglePanel = useCallback( () => {
		setIsOpen( ( current ) => {
			const next = ! current;
			if ( next ) {
				setTimeout( () => inputRef.current?.focus(), 0 );
			}
			return next;
		} );
	}, [] );

	const handleStarter = useCallback(
		( action ) => {
			if ( ! isValidStarterAction( action ) ) {
				return;
			}
			setHasAskedStarter( true );
			addMessage( 'user', action.label );
			deweyHandlers.onAnswerReady( 1 );
			addMessage( 'assistant', action.reply );
		},
		[ addMessage, deweyHandlers ]
	);

	const handleSubmit = useCallback(
		async ( event ) => {
			event.preventDefault();
			if ( isSubmitting ) {
				return;
			}
			const now = Date.now();
			if ( now - lastSubmitAtRef.current < SUBMIT_THROTTLE_MS ) {
				return;
			}

			const question = normalizeUserInput( inputValue ).trim();
			if ( ! question ) {
				return;
			}
			lastSubmitAtRef.current = now;

			setInputValue( '' );
			addMessage( 'user', question );
			deweyHandlers.onQueryStart();

			if ( ! isAiConnected ) {
				deweyHandlers.onNoResults();
				addMessage( 'assistant', NO_AI_MESSAGE );
				return;
			}

			setIsSubmitting( true );
			try {
				const response = await callDeweyApi( '/query', { question } );
				if ( response?.requires_confirm && response?.token ) {
					deweyHandlers.onPostsFound( 1 );
					deweyHandlers.onAnswerReady( 1 );
					addMessage(
						'assistant',
						String(
							response.message ||
								'This change needs confirmation.'
						),
						{
							actions: [
								{
									id: `confirm-${ response.token }`,
									label: 'Confirm',
									kind: 'confirm',
									token: response.token,
								},
							],
						}
					);
					return;
				}

				const citations = normalizeCitations( response?.citations );
				if ( citations.length > 0 ) {
					deweyHandlers.onPostsFound( citations.length );
				} else {
					deweyHandlers.onNoResults();
				}
				deweyHandlers.onAnswerReady( Math.max( 1, citations.length ) );
				addMessage(
					'assistant',
					String(
						response?.answer || 'I could not generate an answer.'
					),
					{
						citations,
					}
				);
			} catch ( error ) {
				deweyHandlers.onError();
				addMessage(
					'assistant',
					error instanceof Error
						? error.message
						: 'Dewey hit an unexpected error.'
				);
			} finally {
				setIsSubmitting( false );
			}
		},
		[ addMessage, deweyHandlers, inputValue, isAiConnected, isSubmitting ]
	);

	const handleMessageAction = useCallback(
		async ( action ) => {
			if ( ! action || action.kind !== 'confirm' || ! action.token ) {
				return;
			}
			try {
				const response = await callDeweyApi( '/confirm-action', {
					token: action.token,
					approved: true,
				} );
				addMessage(
					'assistant',
					String( response?.message || 'Confirmed.' )
				);
			} catch ( error ) {
				addMessage(
					'assistant',
					error instanceof Error
						? error.message
						: 'Failed to confirm action.'
				);
			}
		},
		[ addMessage ]
	);

	return {
		isOpen,
		inputValue,
		messages,
		hasAskedStarter,
		isSubmitting,
		isAiConnected,
		deweyState,
		speech,
		inputRef,
		setInputValue: ( nextValue ) =>
			setInputValue( normalizeUserInput( nextValue ) ),
		openPanel,
		closePanel,
		togglePanel,
		handleStarter,
		handleMessageAction,
		handleSubmit,
	};
}
