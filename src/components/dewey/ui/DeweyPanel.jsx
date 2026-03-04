/**
 * DeweyPanel.jsx
 */

import { memo, useEffect, useMemo } from '@wordpress/element';
import { Button, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import MessageList from './MessageList';

function resolveConnectorsUrl() {
	// PHP injects the canonical URL via admin_url() + wp_json_encode.
	// Trust it directly; only fall back if somehow absent.
	const localizedUrl = window.deweyConfig?.connectorsUrl;
	if ( typeof localizedUrl === 'string' && localizedUrl.trim() !== '' ) {
		return localizedUrl;
	}
	return '/wp-admin/options-general.php?page=connectors-wp-admin';
}

function DeweyPanel( {
	messages,
	hasAskedStarter,
	isSubmitting,
	isAiConnected,
	connectionDebug,
	citationStyle,
	onStarterSelect,
	onMessageAction,
	onClose,
	onClearConversation,
	onSubmit,
	inputRef,
	inputValue,
	onInputChange,
	navSuggestions = [],
	onNavigate,
} ) {
	const connectorsUrl = useMemo( () => resolveConnectorsUrl(), [] );
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
		>
			<header className="dewey-panel__header">
				<div id={ titleId } className="dewey-panel__title">
					<span>{ __( 'Ask Dewey', 'dewey' ) }</span>
				</div>
				<div
					className={ `dewey-panel__connection ${
						isAiConnected
							? 'dewey-panel__connection--connected'
							: 'dewey-panel__connection--disconnected'
					}` }
					role="status"
					aria-live="polite"
				>
					{ isAiConnected
						? __( 'AI connected', 'dewey' )
						: __( 'AI not connected', 'dewey' ) }
				</div>
				<Button
					variant="tertiary"
					className="dewey-panel__clear"
					icon="update"
					label={ __( 'New conversation', 'dewey' ) }
					showTooltip
					onClick={ onClearConversation }
				/>
				<Button
					variant="tertiary"
					className="dewey-panel__close"
					icon="no-alt"
					label={ __( 'Close Dewey panel', 'dewey' ) }
					onClick={ onClose }
				/>
			</header>

			{ ! isAiConnected && (
				<div className="dewey-panel__notice" role="note">
					{ __( 'Connect an AI provider in', 'dewey' ) }{ ' ' }
					<a
						href={ connectorsUrl }
						className="dewey-panel__notice-link"
					>
						{ __( 'Settings -> Connectors', 'dewey' ) }
					</a>{ ' ' }
					{ __( 'to get full archive answers.', 'dewey' ) }
					{ connectionDebug && (
						<details className="dewey-panel__debug">
							<summary>
								{ __( 'Connection diagnostics', 'dewey' ) }
							</summary>
							<pre className="dewey-panel__debug-output">
								{ JSON.stringify( connectionDebug, null, 2 ) }
							</pre>
						</details>
					) }
				</div>
			) }

			<MessageList
				messages={ messages }
				hasAskedStarter={ hasAskedStarter }
				isSubmitting={ isSubmitting }
				citationStyle={ citationStyle }
				onStarterSelect={ onStarterSelect }
				onMessageAction={ onMessageAction }
			/>

			{ navSuggestions.length > 0 && ! isSubmitting && (
				<ul className="dewey-panel__nav-suggestions">
					{ navSuggestions.map( ( cmd ) => (
						<li key={ cmd.id }>
							<button
								type="button"
								className="dewey-panel__nav-chip"
								onClick={ () => onNavigate( cmd ) }
							>
								<span className="dewey-panel__nav-chip-label">
									{ cmd.label }
								</span>
								<span
									className="dewey-panel__nav-chip-arrow"
									aria-hidden="true"
								>
									→
								</span>
							</button>
						</li>
					) ) }
				</ul>
			) }

			<form className="dewey-panel__form" onSubmit={ onSubmit }>
				<TextControl
					ref={ inputRef }
					className="dewey-panel__input-control"
					label={ __( 'Ask Dewey', 'dewey' ) }
					hideLabelFromVision
					value={ inputValue }
					onChange={ onInputChange }
					placeholder={ __( 'Ask Dewey…', 'dewey' ) }
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
					label={ __( 'Send message', 'dewey' ) }
					showTooltip={ false }
					disabled={ isSubmitDisabled || isSubmitting }
				/>
			</form>
		</section>
	);
}

export default memo( DeweyPanel );
