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

export function useDeweyChat() {
	const isFirstOpen = useMemo( () => getInitialOpenState(), [] );
	const [ isOpen, setIsOpen ] = useState( isFirstOpen );
	const [ inputValue, setInputValue ] = useState( '' );
	const [ messages, setMessages ] = useState( [ createWelcomeMessage() ] );
	const [ hasAskedStarter, setHasAskedStarter ] = useState( false );
	const inputRef = useRef( null );
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
		setMessages( ( current ) => [
			...current,
			createMessage( role, text, extra ),
		] );
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

			const question = inputValue.trim();
			if ( ! question ) {
				return;
			}

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
		setInputValue,
		openPanel,
		closePanel,
		togglePanel,
		handleStarter,
		handleSubmit,
	};
}
