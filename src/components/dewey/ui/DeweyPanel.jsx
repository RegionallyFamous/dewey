/**
 * DeweyPanel.jsx
 */

import MessageList from './MessageList';

export default function DeweyPanel( {
	messages,
	hasAskedStarter,
	onStarterSelect,
	onClose,
	onSubmit,
	inputRef,
	inputValue,
	onInputChange,
} ) {
	return (
		<section
			id="dewey-panel"
			className="dewey-panel"
			aria-label="Dewey panel"
		>
			<header className="dewey-panel__header">
				<div className="dewey-panel__title">
					<span>Dewey</span>
				</div>
				<button
					type="button"
					className="dewey-panel__close"
					aria-label="Close Dewey panel"
					onClick={ onClose }
				>
					×
				</button>
			</header>

			<MessageList
				messages={ messages }
				hasAskedStarter={ hasAskedStarter }
				onStarterSelect={ onStarterSelect }
			/>

			<form className="dewey-panel__form" onSubmit={ onSubmit }>
				<input
					ref={ inputRef }
					type="text"
					className="dewey-panel__input"
					value={ inputValue }
					onChange={ ( event ) =>
						onInputChange( event.target.value )
					}
					placeholder="Ask Dewey..."
				/>
				<button
					type="submit"
					className="dewey-panel__submit"
					aria-label="Send message"
				>
					➤
				</button>
			</form>
		</section>
	);
}
