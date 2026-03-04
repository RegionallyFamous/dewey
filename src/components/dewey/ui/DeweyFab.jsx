/**
 * DeweyFab.jsx
 */

import {
	memo,
	useCallback,
	useEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import Dewey from '../Dewey';
import SimpleDeweyMark from './SimpleDeweyMark';

const MOBILE_UI_QUERY = '(max-width: 782px), (pointer: coarse)';
const RAPID_CLICK_COUNT = 10;
const RAPID_CLICK_WINDOW_MS = 2000;
const LONG_PRESS_MS = 3000;
const SPIN_DURATION_MS = 700;
const SLEEPY_DURATION_MS = 2500;

function getIsMobileUi() {
	if (
		typeof window === 'undefined' ||
		typeof window.matchMedia !== 'function'
	) {
		return false;
	}

	return window.matchMedia( MOBILE_UI_QUERY ).matches;
}

function DeweyFab( { isOpen, onToggle, easterEggState } ) {
	const [ isMobileUi, setIsMobileUi ] = useState( () => getIsMobileUi() );
	const [ isSpinning, setIsSpinning ] = useState( false );
	const [ isSleepy, setIsSleepy ] = useState( false );

	const clickTimesRef = useRef( [] );
	const longPressTimerRef = useRef( null );

	useEffect( () => {
		if (
			typeof window === 'undefined' ||
			typeof window.matchMedia !== 'function'
		) {
			return undefined;
		}

		const media = window.matchMedia( MOBILE_UI_QUERY );
		const onChange = () => setIsMobileUi( media.matches );
		onChange();

		if ( typeof media.addEventListener === 'function' ) {
			media.addEventListener( 'change', onChange );
			return () => media.removeEventListener( 'change', onChange );
		}

		if ( typeof media.addListener === 'function' ) {
			media.addListener( onChange );
			return () => media.removeListener( onChange );
		}

		return undefined;
	}, [] );

	// Clear long-press timer on unmount.
	useEffect( () => {
		return () => {
			if ( longPressTimerRef.current ) {
				clearTimeout( longPressTimerRef.current );
			}
		};
	}, [] );

	const handleClick = useCallback( () => {
		const now = Date.now();
		// Prune clicks outside the rolling window.
		clickTimesRef.current = clickTimesRef.current.filter(
			( t ) => now - t < RAPID_CLICK_WINDOW_MS
		);
		clickTimesRef.current.push( now );

		if ( clickTimesRef.current.length >= RAPID_CLICK_COUNT ) {
			clickTimesRef.current = [];
			setIsSpinning( true );
			setTimeout( () => setIsSpinning( false ), SPIN_DURATION_MS );
		}

		onToggle();
	}, [ onToggle ] );

	const handlePointerDown = useCallback( () => {
		longPressTimerRef.current = setTimeout( () => {
			setIsSleepy( true );
			setTimeout( () => setIsSleepy( false ), SLEEPY_DURATION_MS );
		}, LONG_PRESS_MS );
	}, [] );

	const handlePointerUp = useCallback( () => {
		if ( longPressTimerRef.current ) {
			clearTimeout( longPressTimerRef.current );
			longPressTimerRef.current = null;
		}
	}, [] );

	const isCaffeinated = easterEggState === 'coffee';

	const classNames = [
		'dewey-fab',
		isOpen ? 'dewey-fab--open' : '',
		isSpinning ? 'dewey-fab--spin' : '',
		isCaffeinated ? 'dewey-fab--caffeinated' : '',
	]
		.filter( Boolean )
		.join( ' ' );

	return (
		<button
			type="button"
			className={ classNames }
			aria-expanded={ isOpen }
			aria-controls="dewey-panel"
			aria-label={
				isOpen
					? __( 'Close Dewey chat', 'dewey' )
					: __( 'Open Dewey chat', 'dewey' )
			}
			onClick={ handleClick }
			onPointerDown={ handlePointerDown }
			onPointerUp={ handlePointerUp }
			onPointerLeave={ handlePointerUp }
		>
			<span className="dewey-fab__icon" aria-hidden="true">
				{ isMobileUi ? (
					<span className="dewey-fab__emoji">
						<SimpleDeweyMark />
					</span>
				) : (
					<Dewey
						state={ isOpen ? 'hello' : 'idle' }
						size={ 120 }
						showSpeech={ false }
						showParticles={ false }
						className="dewey-fab__character"
					/>
				) }
			</span>
			{ isSleepy && (
				<span className="dewey-fab__sleepy" aria-hidden="true">
					{ __( "Zzz\u2026 oh! You're back.", 'dewey' ) }
				</span>
			) }
		</button>
	);
}

export default memo( DeweyFab );
