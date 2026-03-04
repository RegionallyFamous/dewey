/**
 * DeweyPanel.jsx
 */

import { memo, useEffect, useMemo, useRef } from '@wordpress/element';
import { Button, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import MessageList from './MessageList';

const CONFETTI_COLORS = [
	'#2271b1',
	'#d63638',
	'#f0c33c',
	'#00a32a',
	'#f86368',
	'#72aee6',
	'#8c8f94',
	'#3858e9',
];

/**
 * Renders a burst of confetti particles. Each particle gets randomized
 * position, color, size, and animation delay, all seeded once on mount.
 */
function ConfettiBurst() {
	const particles = useRef(
		Array.from( { length: 30 }, ( _, i ) => ( {
			key: i,
			left: Math.random() * 100,
			color: CONFETTI_COLORS[ i % CONFETTI_COLORS.length ],
			size: 6 + Math.random() * 6,
			delay: Math.random() * 0.6,
			duration: 1.2 + Math.random() * 1.0,
		} ) )
	).current;

	return (
		<div className="dewey-confetti" aria-hidden="true">
			{ particles.map( ( p ) => (
				<div
					key={ p.key }
					className="dewey-confetti__particle"
					style={ {
						left: `${ p.left }%`,
						backgroundColor: p.color,
						width: p.size,
						height: p.size,
						animationDelay: `${ p.delay }s`,
						animationDuration: `${ p.duration }s`,
					} }
				/>
			) ) }
		</div>
	);
}

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
	citationStyle,
	showConfetti,
	wpDieActive,
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
			className={ `dewey-panel${
				wpDieActive ? ' dewey-panel--dying' : ''
			}` }
			role="dialog"
			aria-modal="false"
			aria-labelledby={ titleId }
		>
			{ showConfetti && <ConfettiBurst /> }
			<header className="dewey-panel__header">
				<div id={ titleId } className="dewey-panel__title">
					<span>{ __( 'Ask Dewey', 'dewey' ) }</span>
				</div>
				{ isAiConnected && (
					<div
						className="dewey-panel__connection dewey-panel__connection--connected"
						role="status"
						aria-live="polite"
					>
						{ __( 'AI on', 'dewey' ) }
					</div>
				) }
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
					{ __( 'Navigation and actions work now.', 'dewey' ) }{ ' ' }
					<a
						href={ connectorsUrl }
						className="dewey-panel__notice-link"
					>
						{ __( 'Add an AI provider', 'dewey' ) }
					</a>{ ' ' }
					{ __( 'to unlock Q&A and archive search.', 'dewey' ) }
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
