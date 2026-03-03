/**
 * DeweyFab.jsx
 */

import Dewey from '../Dewey';

export default function DeweyFab( { isOpen, onToggle } ) {
	return (
		<button
			type="button"
			className={ `dewey-fab ${ isOpen ? 'dewey-fab--open' : '' }` }
			aria-expanded={ isOpen }
			aria-controls="dewey-panel"
			onClick={ onToggle }
		>
			<span className="dewey-fab__icon" aria-hidden="true">
				<Dewey
					state={ isOpen ? 'hello' : 'idle' }
					size={ 120 }
					showSpeech={ false }
					className="dewey-fab__character"
				/>
			</span>
		</button>
	);
}
