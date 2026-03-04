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
import { __ } from '@wordpress/i18n';
import {
	DEWEY_SOUL_SYSTEM_PROMPT,
	FIRST_OPEN_MESSAGE,
	INVESTIGATION_MESSAGE,
	NO_AI_MESSAGE,
	PAGE_CONTEXT_HINTS,
	STARTER_ACTIONS,
	STORAGE_KEYS,
	getSpeechText,
} from './copy';
import { useDewey } from './useDewey';

const MAX_INPUT_CHARS = 500;
const MAX_MESSAGES = 80;
const MAX_HISTORY_TURNS = 6;
const MAX_HISTORY_CHARS = 320;
const SUBMIT_THROTTLE_MS = 800;
const CONNECTION_REFRESH_THROTTLE_MS = 2000;
const STORAGE_VERSION = 1;
const STORAGE_MAX_MESSAGES = 50;
const STORAGE_MAX_BYTES = 150_000;
const STORAGE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const CONTROL_CHARS_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const REQUEST_TIMEOUT_MS = 30000;

function isDebugEnabled() {
	return Boolean( window.deweyConfig?.debugEnabled );
}

function emitDebugLog( label, payload ) {
	if ( ! isDebugEnabled() || ! window.console ) {
		return;
	}
	const serialized =
		typeof payload === 'string'
			? payload
			: JSON.stringify( payload, null, 2 );
	window.console.info( `[Dewey AI Debug] ${ label } ${ serialized }` );
}

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
		timestamp: Date.now(),
		...extra,
	};
}

/**
 * Extract the post ID from the current admin URL (e.g. ?post=123&action=edit).
 * Returns 0 when not on a single-post editing screen.
 */
function getCurrentPostId() {
	try {
		const params = new URLSearchParams( window.location.search );
		const post = parseInt( params.get( 'post' ) ?? '0', 10 );
		const action = params.get( 'action' );
		// Only send the post ID when actively editing — not on the posts list.
		if ( post > 0 && ( action === 'edit' || action === null ) ) {
			return post;
		}
	} catch ( e ) {
		// Ignore — non-standard environments.
	}
	return 0;
}

/**
 * If there is a stored conversation from within the last 4 hours, return a
 * pick-up greeting that references the last question asked. Returns null when
 * there is nothing recent to reference.
 *
 * @param {Array}  storedMessages The restored message array from localStorage.
 * @param {number} savedAt        Unix ms timestamp from the storage envelope.
 * @return {string|null} Greeting string, or null if no recent conversation exists.
 */
function buildReturnGreeting( storedMessages, savedAt ) {
	const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
	if ( ! savedAt || Date.now() - savedAt > FOUR_HOURS_MS ) {
		return null;
	}

	// Need at least one real exchange beyond the welcome message.
	const conversational = storedMessages.filter(
		( m ) => m.id !== 'welcome' && m.role === 'user'
	);
	if ( conversational.length === 0 ) {
		return null;
	}

	const lastUserMsg = conversational[ conversational.length - 1 ];
	const topic = String( lastUserMsg.text ?? '' )
		.trim()
		.slice( 0, 60 );
	const ellipsis = ( lastUserMsg.text ?? '' ).length > 60 ? '…' : '';

	const name =
		typeof window.deweyConfig?.currentUser === 'string' &&
		window.deweyConfig.currentUser.trim() !== ''
			? window.deweyConfig.currentUser.trim()
			: null;

	if ( name ) {
		return `${ name } — we were just talking about "${ topic }${ ellipsis }". Want to pick up where we left off, or ask something new?`;
	}
	return `Welcome back — we were talking about "${ topic }${ ellipsis }". Want to continue, or ask something new?`;
}

function getTimeOfDayGreeting( name ) {
	const h = new Date().getHours();
	let salutation;
	if ( h < 12 ) {
		salutation = 'Morning';
	} else if ( h < 17 ) {
		salutation = 'Afternoon';
	} else if ( h < 21 ) {
		salutation = 'Evening';
	} else {
		salutation = 'Working late';
	}

	if ( name ) {
		const suffix =
			h < 17 ? ' — what are you working on?' : ' — what do you need?';
		return `${ salutation }, ${ name }${ suffix }`;
	}

	// No name — use the fallback copy string.
	return null;
}

function createWelcomeMessage() {
	const name =
		typeof window.deweyConfig?.currentUser === 'string' &&
		window.deweyConfig.currentUser.trim() !== ''
			? window.deweyConfig.currentUser.trim()
			: null;

	const greeting = getTimeOfDayGreeting( name ) ?? FIRST_OPEN_MESSAGE;

	// If the current wp-admin screen is recognized, append a contextual hint and
	// swap in page-specific action chips so the first suggestion is always relevant.
	const pagenow = typeof window.pagenow === 'string' ? window.pagenow : '';
	const pageHint = pagenow ? PAGE_CONTEXT_HINTS[ pagenow ] ?? null : null;

	const welcomeText = pageHint
		? `${ greeting } ${ pageHint.hint }`
		: greeting;
	const welcomeActions = pageHint ? pageHint.actions : STARTER_ACTIONS;

	return createMessage( 'assistant', welcomeText, {
		id: 'welcome',
		actions: welcomeActions,
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

function getScreenContextPayload() {
	const raw = window.deweyConfig?.screenContext;
	if ( ! raw || typeof raw !== 'object' || Array.isArray( raw ) ) {
		return {};
	}

	return raw;
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
		const error = new Error(
			typeof body?.message === 'string' && body.message
				? body.message
				: `Request failed (${ response.status })`
		);
		error.deweyCode =
			typeof body?.code === 'string' ? body.code : 'dewey_request_failed';
		error.deweyStatus = response.status;
		error.deweyBody = body;
		throw error;
	}

	return body;
}

async function getServerStatus() {
	const query = isDebugEnabled() ? '?debug=1' : '';
	return callDeweyApi( `/status${ query }` );
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

/**
 * Load messages persisted from a previous session. Validates the schema
 * version and drops any session older than STORAGE_TTL_MS. Confirm-action
 * buttons are stripped because their tokens are one-time and expire.
 *
 * @return {Array} Restored message array, or a fresh welcome message array.
 */
function loadStoredMessages() {
	try {
		const raw = window.localStorage.getItem( STORAGE_KEYS.messages );
		if ( ! raw ) {
			return [ createWelcomeMessage() ];
		}
		const envelope = JSON.parse( raw );
		if (
			! envelope ||
			envelope.v !== STORAGE_VERSION ||
			! Array.isArray( envelope.messages ) ||
			typeof envelope.savedAt !== 'number' ||
			Date.now() - envelope.savedAt > STORAGE_TTL_MS
		) {
			return [ createWelcomeMessage() ];
		}
		const restored = envelope.messages.map( ( m ) => {
			if ( ! m || typeof m !== 'object' ) {
				return null;
			}
			const clean = { ...m };
			if ( Array.isArray( clean.actions ) ) {
				clean.actions = clean.actions.filter(
					( a ) => a && a.kind !== 'confirm'
				);
				if ( clean.actions.length === 0 ) {
					delete clean.actions;
				}
			}
			return clean;
		} );
		const valid = restored.filter( Boolean );
		if ( valid.length === 0 ) {
			return [ createWelcomeMessage() ];
		}

		// If there is a recent conversation, swap the welcome message text for a
		// pick-up greeting so Dewey acknowledges the context on return.
		const returnGreeting = buildReturnGreeting( valid, envelope.savedAt );
		if ( returnGreeting && valid[ 0 ] ) {
			valid[ 0 ] = { ...valid[ 0 ], text: returnGreeting };
		}
		return valid;
	} catch ( e ) {
		return [ createWelcomeMessage() ];
	}
}

/**
 * Persist the message array to localStorage inside a versioned envelope.
 * Caps at STORAGE_MAX_MESSAGES and STORAGE_MAX_BYTES; the welcome message is
 * always kept as the first entry regardless of caps.
 *
 * @param {Array} msgs Message array to persist.
 */
function saveMessages( msgs ) {
	try {
		const welcome = msgs[ 0 ];
		let toStore = msgs;
		if ( toStore.length > STORAGE_MAX_MESSAGES ) {
			toStore = [
				welcome,
				...toStore.slice( -( STORAGE_MAX_MESSAGES - 1 ) ),
			];
		}
		const envelope = {
			v: STORAGE_VERSION,
			savedAt: Date.now(),
			messages: toStore,
		};
		const serialized = JSON.stringify( envelope );
		if ( serialized.length > STORAGE_MAX_BYTES ) {
			// Drop older messages (but keep welcome) until it fits.
			let trimmed = [ ...toStore ];
			while (
				trimmed.length > 2 &&
				JSON.stringify( {
					v: STORAGE_VERSION,
					savedAt: Date.now(),
					messages: trimmed,
				} ).length > STORAGE_MAX_BYTES
			) {
				trimmed = [ welcome, ...trimmed.slice( 2 ) ];
			}
			window.localStorage.setItem(
				STORAGE_KEYS.messages,
				JSON.stringify( {
					v: STORAGE_VERSION,
					savedAt: Date.now(),
					messages: trimmed,
				} )
			);
			return;
		}
		window.localStorage.setItem( STORAGE_KEYS.messages, serialized );
	} catch ( e ) {
		// Quota exceeded or private mode — silently skip.
	}
}

/**
 * Build a conversation history array from the messages state, excluding the
 * permanent welcome message and capping at MAX_HISTORY_TURNS most-recent turns.
 *
 * @param {Array} allMessages All current chat messages.
 * @return {Array<{role: string, text: string}>} Sanitized history turns.
 */
function buildHistory( allMessages ) {
	const conversational = allMessages.filter(
		( m ) =>
			m.id !== 'welcome' &&
			( m.role === 'user' || m.role === 'assistant' )
	);
	if ( conversational.length === 0 ) {
		return [];
	}

	// Keep more user turns than assistant turns: user context tends to carry
	// more decision signal, while a single recent assistant turn preserves
	// conversational continuity at lower token cost.
	const includeIndexes = new Set();
	const maxUserTurns = Math.max( 1, MAX_HISTORY_TURNS - 1 );
	let userCount = 0;

	for ( let i = conversational.length - 1; i >= 0; i-- ) {
		if ( conversational[ i ]?.role !== 'user' ) {
			continue;
		}
		includeIndexes.add( i );
		userCount++;
		if ( userCount >= maxUserTurns ) {
			break;
		}
	}

	for ( let i = conversational.length - 1; i >= 0; i-- ) {
		if ( conversational[ i ]?.role === 'assistant' ) {
			includeIndexes.add( i );
			break;
		}
	}

	return Array.from( includeIndexes )
		.sort( ( a, b ) => a - b )
		.map( ( index ) => conversational[ index ] )
		.filter( Boolean )
		.slice( -MAX_HISTORY_TURNS )
		.map( ( m ) => ( {
			role: m.role,
			text: String( m.text || '' ).slice( 0, MAX_HISTORY_CHARS ),
		} ) );
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
	const [ messages, setMessages ] = useState( () => loadStoredMessages() );
	const [ hasAskedStarter, setHasAskedStarter ] = useState( false );
	const [ isSubmitting, setIsSubmitting ] = useState( false );
	const [ isAiConnected, setIsAiConnected ] = useState( () =>
		detectAiConnection()
	);
	const [ connectionDebug, setConnectionDebug ] = useState( null );
	const inputRef = useRef( null );
	const lastSubmitAtRef = useRef( 0 );
	const lastQuestionRef = useRef( '' );
	const lastConnectionRefreshAtRef = useRef( 0 );
	const connectionRefreshInFlightRef = useRef( false );
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
		const refreshConnection = async () => {
			if ( connectionRefreshInFlightRef.current ) {
				return;
			}
			const now = Date.now();
			if (
				now - lastConnectionRefreshAtRef.current <
				CONNECTION_REFRESH_THROTTLE_MS
			) {
				return;
			}
			lastConnectionRefreshAtRef.current = now;
			connectionRefreshInFlightRef.current = true;

			try {
				let runtimeSupported = null;
				let runtimeError = '';
				let serverStatus = null;
				let serverError = '';
				const localized = detectAiConnection();

				const aiClient = window.wp?.aiClient;
				if ( aiClient && typeof aiClient.prompt === 'function' ) {
					try {
						const prompt = aiClient.prompt( 'Connection check' );
						if (
							typeof prompt?.isSupportedForTextGeneration ===
							'function'
						) {
							runtimeSupported = Boolean(
								await prompt.isSupportedForTextGeneration()
							);
						}
					} catch ( error ) {
						runtimeError =
							error instanceof Error
								? error.message
								: 'Client capability check failed.';
					}
				}

				if ( typeof window.fetch === 'function' ) {
					try {
						serverStatus = await getServerStatus();
					} catch ( error ) {
						serverError =
							error instanceof Error
								? error.message
								: 'Status endpoint probe failed.';
					}
				}

				const serverConnected =
					typeof serverStatus?.ai_connected === 'boolean'
						? serverStatus.ai_connected
						: null;
				const nextConnected = Boolean(
					serverConnected ?? runtimeSupported ?? localized
				);
				const hasProbeData =
					null !== runtimeSupported ||
					null !== serverConnected ||
					'' !== runtimeError ||
					'' !== serverError;
				const nextDebug = {
					localized,
					runtimeSupported,
					runtimeError,
					serverConnected,
					serverError,
					serverDebug:
						serverStatus &&
						typeof serverStatus === 'object' &&
						serverStatus.ai_connection_debug
							? serverStatus.ai_connection_debug
							: null,
				};

				if ( hasProbeData || isDebugEnabled() ) {
					emitDebugLog( 'connection_probe', nextDebug );
				}

				if ( isActive ) {
					if ( hasProbeData ) {
						setIsAiConnected( nextConnected );
					}
					if ( hasProbeData || isDebugEnabled() ) {
						setConnectionDebug( nextDebug );
					}
				}
			} finally {
				connectionRefreshInFlightRef.current = false;
			}
		};

		void refreshConnection();
		const onRefresh = () => {
			if (
				typeof document !== 'undefined' &&
				document.visibilityState === 'hidden'
			) {
				return;
			}
			void refreshConnection();
		};
		window.addEventListener( 'focus', onRefresh );
		document.addEventListener( 'visibilitychange', onRefresh );

		return () => {
			isActive = false;
			window.removeEventListener( 'focus', onRefresh );
			document.removeEventListener( 'visibilitychange', onRefresh );
		};
	}, [] );

	const speech = useMemo( () => getSpeechText( deweyState ), [ deweyState ] );

	const addMessage = useCallback( ( role, text, extra = {} ) => {
		setMessages( ( current ) => {
			let next = [ ...current, createMessage( role, text, extra ) ];
			if ( next.length > MAX_MESSAGES ) {
				const [ welcomeMessage ] = next;
				const tail = next.slice( next.length - ( MAX_MESSAGES - 1 ) );
				next = [ welcomeMessage, ...tail ];
			}
			saveMessages( next );
			return next;
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

	// Alt+Shift+D keyboard shortcut to toggle the panel from anywhere in wp-admin.
	useEffect( () => {
		const onKeyDown = ( event ) => {
			if ( ! event.altKey || ! event.shiftKey || event.key !== 'D' ) {
				return;
			}
			const activeElement =
				inputRef.current?.ownerDocument?.activeElement ?? null;
			const tag = activeElement?.tagName;
			if (
				tag === 'INPUT' ||
				tag === 'TEXTAREA' ||
				activeElement?.isContentEditable
			) {
				return;
			}
			event.preventDefault();
			setIsOpen( ( current ) => {
				const next = ! current;
				if ( next ) {
					setTimeout( () => inputRef.current?.focus(), 0 );
				}
				return next;
			} );
		};
		window.addEventListener( 'keydown', onKeyDown );
		return () => window.removeEventListener( 'keydown', onKeyDown );
	}, [] );

	const clearConversation = useCallback( () => {
		try {
			window.localStorage.removeItem( STORAGE_KEYS.messages );
		} catch ( e ) {}
		const fresh = createWelcomeMessage();
		setMessages( [ fresh ] );
		setHasAskedStarter( false );
		setTimeout( () => inputRef.current?.focus(), 0 );
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

	/**
	 * Core question submission logic shared by the form, follow-up chips, and retry.
	 * Throttle and duplicate-guard are applied here.
	 */
	const submitQuestion = useCallback(
		async ( question ) => {
			if ( isSubmitting ) {
				return;
			}
			const now = Date.now();
			if ( now - lastSubmitAtRef.current < SUBMIT_THROTTLE_MS ) {
				return;
			}
			lastSubmitAtRef.current = now;
			lastQuestionRef.current = question;

			addMessage( 'user', question );
			deweyHandlers.onQueryStart();

			if ( ! isAiConnected && ! getApiConfig() ) {
				deweyHandlers.onNoResults();
				addMessage( 'assistant', NO_AI_MESSAGE );
				return;
			}

			setIsSubmitting( true );
			try {
				// Pass Dewey's canonical persona prompt so downstream LLM calls
				// keep the voice consistent regardless of provider.
				// Include the recent conversation history so Dewey can handle
				// follow-up questions like "tell me more about that".
				const history = buildHistory( messages );
				const response = await callDeweyApi( '/query', {
					question,
					history,
					assistant_system_prompt: DEWEY_SOUL_SYSTEM_PROMPT,
					page_context:
						typeof window.pagenow === 'string'
							? window.pagenow
							: '',
					post_id: getCurrentPostId(),
					screen_context: getScreenContextPayload(),
				} );
				setIsAiConnected( true );

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
									label: __( 'Confirm', 'dewey' ),
									kind: 'confirm',
									token: response.token,
								},
							],
						}
					);
					return;
				}

				// Content action proposal — destructive actions need a confirm step.
				if ( response?.proposed_action ) {
					const pa = response.proposed_action;
					deweyHandlers.onAnswerReady( 1 );
					addMessage( 'assistant', String( response.answer || '' ), {
						actions: pa.token
							? [
									{
										id: `exec-${ pa.token.slice( 0, 16 ) }`,
										label: String(
											pa.label || __( 'Confirm', 'dewey' )
										),
										kind: 'execute-action',
										token: pa.token,
										destructive: Boolean( pa.destructive ),
									},
							  ]
							: undefined,
					} );
					return;
				}

				// Direct action result (create, list) — action already executed.
				if ( response?.action_result ) {
					deweyHandlers.onAnswerReady( 1 );
					addMessage( 'assistant', String( response.answer || '' ), {
						action_result: response.action_result,
					} );
					return;
				}

				const citations = normalizeCitations( response?.citations );
				if ( citations.length > 0 ) {
					deweyHandlers.onPostsFound( citations.length );
				} else {
					deweyHandlers.onNoResults();
				}
				deweyHandlers.onAnswerReady( Math.max( 1, citations.length ) );

				// Build follow-up chips from the backend's suggested questions.
				const rawFollowUps = Array.isArray( response?.follow_ups )
					? response.follow_ups
					: [];
				const followUpActions = rawFollowUps
					.filter(
						( q ) => typeof q === 'string' && q.trim().length > 0
					)
					.slice( 0, 3 )
					.map( ( q, i ) => ( {
						id: `followup-${ i }-${ Date.now() }`,
						kind: 'followup',
						label: q.trim(),
						question: q.trim(),
					} ) );

				addMessage(
					'assistant',
					String( response?.answer || INVESTIGATION_MESSAGE ),
					{
						citations,
						actions:
							followUpActions.length > 0
								? followUpActions
								: undefined,
					}
				);
			} catch ( error ) {
				const maybeCode =
					error &&
					typeof error === 'object' &&
					typeof error.deweyCode === 'string'
						? error.deweyCode
						: '';
				const isConnectionError =
					'dewey_ai_unavailable' === maybeCode ||
					( error instanceof Error &&
						/error while connecting|ai client is not available|provider/i.test(
							error.message
						) );
				if ( isConnectionError ) {
					setIsAiConnected( false );
					deweyHandlers.onNoResults();
					addMessage( 'assistant', NO_AI_MESSAGE );
					return;
				}
				deweyHandlers.onError();
				const rawMessage = error instanceof Error ? error.message : '';
				// Use Dewey's voice for generic failures; keep specific API messages
				// (e.g. rate limit, 503) since they carry actionable information.
				const isGenericError =
					! rawMessage ||
					/unexpected error|failed unexpectedly/i.test( rawMessage );
				const errorText = isGenericError
					? __(
							'Something got tangled up on my end. Hit the retry button — that usually sorts it.',
							'dewey'
					  )
					: rawMessage;
				addMessage( 'assistant', errorText, {
					actions: [
						{
							id: `retry-${ Date.now() }`,
							kind: 'retry',
							label: __( 'Try again', 'dewey' ),
							question: lastQuestionRef.current,
						},
					],
				} );
			} finally {
				setIsSubmitting( false );
			}
		},
		[ addMessage, deweyHandlers, isAiConnected, isSubmitting, messages ]
	);

	const handleSubmit = useCallback(
		async ( event ) => {
			event.preventDefault();
			const question = normalizeUserInput( inputValue ).trim();
			if ( ! question ) {
				return;
			}
			setInputValue( '' );
			await submitQuestion( question );
		},
		[ inputValue, submitQuestion ]
	);

	const handleMessageAction = useCallback(
		async ( action ) => {
			if ( ! action ) {
				return;
			}

			if ( action.kind === 'followup' && action.question ) {
				await submitQuestion( String( action.question ) );
				return;
			}

			if ( action.kind === 'retry' && action.question ) {
				await submitQuestion( String( action.question ) );
				return;
			}

			if ( action.kind === 'execute-action' && action.token ) {
				try {
					const response = await callDeweyApi( '/execute-action', {
						token: action.token,
						approved: true,
					} );
					addMessage(
						'assistant',
						String( response?.message || __( 'Done.', 'dewey' ) ),
						response?.result?.edit_url ||
							response?.result?.permalink
							? {
									action_result: response.result,
							  }
							: {}
					);
				} catch ( error ) {
					addMessage(
						'assistant',
						error instanceof Error
							? error.message
							: __( 'Action failed — please try again.', 'dewey' )
					);
				}
				return;
			}

			if ( action.kind !== 'confirm' || ! action.token ) {
				return;
			}

			try {
				const response = await callDeweyApi( '/confirm-action', {
					token: action.token,
					approved: true,
				} );
				addMessage(
					'assistant',
					String( response?.message || __( 'Confirmed.', 'dewey' ) )
				);
			} catch ( error ) {
				addMessage(
					'assistant',
					error instanceof Error
						? error.message
						: __( 'Failed to confirm action.', 'dewey' )
				);
			}
		},
		[ addMessage, submitQuestion ]
	);

	const citationStyle =
		window.deweyConfig?.citationStyle === 'links' ? 'links' : 'titles';

	return {
		isOpen,
		inputValue,
		messages,
		hasAskedStarter,
		isSubmitting,
		isAiConnected,
		connectionDebug,
		citationStyle,
		deweyState,
		speech,
		inputRef,
		setInputValue: ( nextValue ) =>
			setInputValue( normalizeUserInput( nextValue ) ),
		openPanel,
		closePanel,
		togglePanel,
		clearConversation,
		handleStarter,
		handleMessageAction,
		handleSubmit,
	};
}
