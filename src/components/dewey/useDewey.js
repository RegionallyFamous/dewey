/**
 * useDewey.js
 *
 * Hook that manages Dewey's state in response to the query lifecycle.
 * Plug this into your useChat hook to wire Dewey up automatically.
 *
 * Usage:
 *   const { deweyState, deweyHandlers } = useDewey();
 *
 *   // In your query flow:
 *   deweyHandlers.onQueryStart();
 *   deweyHandlers.onPostsFound( posts.length );
 *   deweyHandlers.onAnswerReady();
 *   deweyHandlers.onNoResults();
 *   deweyHandlers.onError();
 */

import {
	useState,
	useCallback,
	useEffect,
	useMemo,
	useRef,
} from '@wordpress/element';

// How many posts triggers the "dancing" state vs "found"
const DANCE_THRESHOLD = 5;

// How long shocked state lasts before auto-returning to idle (ms)
const SHOCKED_DURATION = 3500;

// How long "found" / "dancing" state shows before settling to idle (ms)
const RESULT_SETTLE_DELAY = 4000;

export function useDewey( initialState = 'idle' ) {
	const [ deweyState, setDeweyState ] = useState( initialState );
	const shockedTimerRef = useRef( null );
	const settleTimerRef = useRef( null );

	const clearTimers = useCallback( () => {
		if ( shockedTimerRef.current ) {
			clearTimeout( shockedTimerRef.current );
			shockedTimerRef.current = null;
		}
		if ( settleTimerRef.current ) {
			clearTimeout( settleTimerRef.current );
			settleTimerRef.current = null;
		}
	}, [] );

	useEffect( () => () => clearTimers(), [ clearTimers ] );

	/**
	 * Called when the user submits a query.
	 * Dewey starts scanning.
	 */
	const onQueryStart = useCallback( () => {
		clearTimers();
		setDeweyState( 'searching' );
	}, [ clearTimers ] );

	/**
	 * Called when the post index returns results.
	 * Dewey starts synthesizing.
	 */
	const onPostsFound = useCallback( ( count ) => {
		if ( count === 0 ) {
			setDeweyState( 'sad' );
			return;
		}
		setDeweyState( 'thinking' );
	}, [] );

	/**
	 * Called when the AI finishes streaming the answer.
	 * Dewey celebrates — harder if there were lots of posts.
	 */
	const onAnswerReady = useCallback(
		( postCount = 1 ) => {
			clearTimers();
			const celebrationState =
				postCount >= DANCE_THRESHOLD ? 'dancing' : 'found';
			setDeweyState( celebrationState );

			// Settle back to idle after celebrating
			settleTimerRef.current = setTimeout( () => {
				setDeweyState( 'idle' );
			}, RESULT_SETTLE_DELAY );
		},
		[ clearTimers ]
	);

	/**
	 * Called when the index returns zero results.
	 */
	const onNoResults = useCallback( () => {
		clearTimers();
		setDeweyState( 'sad' );
	}, [ clearTimers ] );

	/**
	 * Called when something unexpected happens (API error, etc.).
	 */
	const onError = useCallback( () => {
		clearTimers();
		setDeweyState( 'idle' );
	}, [ clearTimers ] );

	/**
	 * Trigger the shocked state — use sparingly for fun moments.
	 * e.g. when the user asks about a really old post.
	 * Auto-returns to idle.
	 */
	const onShock = useCallback( () => {
		clearTimers();
		setDeweyState( 'shocked' );

		shockedTimerRef.current = setTimeout( () => {
			setDeweyState( 'idle' );
		}, SHOCKED_DURATION );
	}, [ clearTimers ] );

	/**
	 * First-time activation. Show the hello state.
	 */
	const onFirstOpen = useCallback( () => {
		clearTimers();
		setDeweyState( 'hello' );

		settleTimerRef.current = setTimeout( () => {
			setDeweyState( 'idle' );
		}, 3000 );
	}, [ clearTimers ] );

	/**
	 * After a very large archive scan completes.
	 */
	const onTired = useCallback( () => {
		clearTimers();
		setDeweyState( 'tired' );

		settleTimerRef.current = setTimeout( () => {
			setDeweyState( 'idle' );
		}, 4000 );
	}, [ clearTimers ] );

	/**
	 * Manually set any state — escape hatch.
	 */
	const setDewey = useCallback(
		( state ) => {
			clearTimers();
			setDeweyState( state );
		},
		[ clearTimers ]
	);

	const deweyHandlers = useMemo(
		() => ( {
			onQueryStart,
			onPostsFound,
			onAnswerReady,
			onNoResults,
			onError,
			onShock,
			onFirstOpen,
			onTired,
			setDewey,
		} ),
		[
			onQueryStart,
			onPostsFound,
			onAnswerReady,
			onNoResults,
			onError,
			onShock,
			onFirstOpen,
			onTired,
			setDewey,
		]
	);

	return {
		deweyState,
		deweyHandlers,
	};
}
