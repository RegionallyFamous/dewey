/**
 * DeweyFab.jsx
 */

import { memo, useEffect, useState } from '@wordpress/element';
import Dewey from '../Dewey';

const MOBILE_UI_QUERY = '(max-width: 782px), (pointer: coarse)';

function getIsMobileUi() {
	if (
		typeof window === 'undefined' ||
		typeof window.matchMedia !== 'function'
	) {
		return false;
	}

	return window.matchMedia( MOBILE_UI_QUERY ).matches;
}

function DeweyFab( { isOpen, onToggle } ) {
	const [ isMobileUi, setIsMobileUi ] = useState( () => getIsMobileUi() );

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

	return (
		<button
			type="button"
			className={ `dewey-fab ${ isOpen ? 'dewey-fab--open' : '' }` }
			aria-expanded={ isOpen }
			aria-controls="dewey-panel"
			aria-label={ isOpen ? 'Close Dewey chat' : 'Open Dewey chat' }
			onClick={ onToggle }
		>
			<span className="dewey-fab__icon" aria-hidden="true">
				{ isMobileUi ? (
					<span className="dewey-fab__emoji">📚</span>
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
		</button>
	);
}

export default memo( DeweyFab );
