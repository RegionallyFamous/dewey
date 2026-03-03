/**
 * DeweyPanel.jsx
 */

import { memo, useEffect, useMemo } from '@wordpress/element';
import { Button, TextControl } from '@wordpress/components';
import MessageList from './MessageList';

function DeweyPanel( {
	messages,
	hasAskedStarter,
	onStarterSelect,
	onClose,
	onSubmit,
	inputRef,
	inputValue,
	onInputChange,
} ) {
	const isSubmitDisabled = useMemo(
		() => ! inputValue.trim(),
		[ inputValue ]
	);
	const titleId = 'dewey-panel-title';

	useEffect( () => {
		const onKeyDown = ( event ) => {
			if ( event.key === 'Escape' ) {
				onClose();
			}
		};
		window.addEventListener( 'keydown', onKeyDown );
		return () => window.removeEventListener( 'keydown', onKeyDown );
	}, [ onClose ] );

	return (
		<section
			id="dewey-panel"
			className="dewey-panel"
			role="dialog"
			aria-modal="false"
			aria-labelledby={ titleId }
			aria-label="Dewey panel"
		>
			<header className="dewey-panel__header">
				<div id={ titleId } className="dewey-panel__title">
					<span>Dewey</span>
				</div>
				<Button
					variant="tertiary"
					className="dewey-panel__close"
					icon="no-alt"
					label="Close Dewey panel"
					onClick={ onClose }
				/>
			</header>

			<MessageList
				messages={ messages }
				hasAskedStarter={ hasAskedStarter }
				onStarterSelect={ onStarterSelect }
			/>

			<form className="dewey-panel__form" onSubmit={ onSubmit }>
				<TextControl
					ref={ inputRef }
					className="dewey-panel__input-control"
					label="Ask Dewey"
					hideLabelFromVision
					value={ inputValue }
					onChange={ onInputChange }
					placeholder="Ask Dewey..."
					maxLength={ 500 }
					autoComplete="off"
					spellCheck={ false }
					__next40pxDefaultSize
					__nextHasNoMarginBottom
				/>
				<Button
					type="submit"
					className="dewey-panel__submit"
					variant="primary"
					icon="arrow-up-alt2"
					label="Send message"
					showTooltip={ false }
					disabled={ isSubmitDisabled }
				/>
			</form>
		</section>
	);
}

export default memo( DeweyPanel );
