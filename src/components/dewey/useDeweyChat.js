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
	CONNECTED_PLACEHOLDER_MESSAGE,
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

export function getInitialOpenState() {
	try {
		return ! window.localStorage.getItem( STORAGE_KEYS.openedOnce );
	} catch ( e ) {
		return true;
	}
}

export function detectAiConnection() {
	const localized = window.deweyConfig?.aiConnected;
	if ( typeof localized === 'boolean' ) {
		return localized;
	}

	try {
		const wpAi = window.wp?.ai;
		if ( ! wpAi ) {
			return false;
		}

		if ( typeof wpAi.hasConnectedProvider === 'function' ) {
			return !! wpAi.hasConnectedProvider();
		}

		if ( Array.isArray( wpAi.connectors ) ) {
			return wpAi.connectors.length > 0;
		}

		return Boolean( wpAi.provider );
	} catch ( e ) {
		return false;
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
	const inputRef = useRef( null );
	const lastSubmitAtRef = useRef( 0 );
	const isAiConnected = useMemo( () => detectAiConnection(), [] );
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
		( event ) => {
			event.preventDefault();
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

			deweyHandlers.onPostsFound( 1 );
			deweyHandlers.onAnswerReady( 1 );
			addMessage( 'assistant', CONNECTED_PLACEHOLDER_MESSAGE );
		},
		[ addMessage, deweyHandlers, inputValue, isAiConnected ]
	);

	return {
		isOpen,
		inputValue,
		messages,
		hasAskedStarter,
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
		handleSubmit,
	};
}
