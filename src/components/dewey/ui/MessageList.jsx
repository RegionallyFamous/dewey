/**
 * MessageList.jsx
 */

import { memo, useEffect, useRef, useState } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import MarkdownText from './MarkdownText';

const COPY_FEEDBACK_MS = 2000;
const TIMESTAMP_TICK_MS = 30_000;

function getRelativeTime( timestamp ) {
	if ( ! timestamp ) {
		return '';
	}
	const diff = Date.now() - timestamp;
	const minutes = Math.floor( diff / 60_000 );
	if ( minutes < 1 ) {
		return __( 'just now', 'dewey' );
	}
	if ( minutes === 1 ) {
		return __( '1 min ago', 'dewey' );
	}
	if ( minutes < 60 ) {
		/* translators: %d: number of minutes */
		return sprintf( __( '%d min ago', 'dewey' ), minutes );
	}
	const hours = Math.floor( minutes / 60 );
	if ( hours === 1 ) {
		return __( '1 hour ago', 'dewey' );
	}
	if ( hours < 24 ) {
		/* translators: %d: number of hours */
		return sprintf( __( '%d hours ago', 'dewey' ), hours );
	}
	return __( 'earlier', 'dewey' );
}

function sprintf( fmt, value ) {
	return fmt.replace( '%d', String( value ) );
}

function CopyButton( { text } ) {
	const [ copied, setCopied ] = useState( false );

	const handleCopy = () => {
		const clipboard =
			typeof window !== 'undefined' ? window.navigator?.clipboard : null;
		if ( ! clipboard ) {
			return;
		}
		clipboard.writeText( text ).then( () => {
			setCopied( true );
			setTimeout( () => setCopied( false ), COPY_FEEDBACK_MS );
		} );
	};

	return (
		<button
			className={ `dewey-message__copy${
				copied ? ' dewey-message__copy--copied' : ''
			}` }
			onClick={ handleCopy }
			aria-label={
				copied
					? __( 'Copied!', 'dewey' )
					: __( 'Copy message', 'dewey' )
			}
			title={ copied ? __( 'Copied!', 'dewey' ) : __( 'Copy', 'dewey' ) }
			type="button"
		>
			{ copied ? '✓' : '⎘' }
		</button>
	);
}

function MessageList( {
	messages,
	hasAskedStarter,
	isSubmitting,
	citationStyle,
	onStarterSelect,
	onMessageAction,
} ) {
	const listRef = useRef( null );
	const shouldStickToBottomRef = useRef( true );
	// Tick forces relative timestamps to re-evaluate every 30 s.
	const [ , setTick ] = useState( 0 );
	useEffect( () => {
		const id = setInterval(
			() => setTick( ( n ) => n + 1 ),
			TIMESTAMP_TICK_MS
		);
		return () => clearInterval( id );
	}, [] );

	useEffect( () => {
		if ( ! listRef.current ) {
			return undefined;
		}

		const node = listRef.current;
		const onScroll = () => {
			const distanceFromBottom =
				node.scrollHeight - node.clientHeight - node.scrollTop;
			shouldStickToBottomRef.current = distanceFromBottom <= 48;
		};
		onScroll();
		node.addEventListener( 'scroll', onScroll );
		return () => node.removeEventListener( 'scroll', onScroll );
	}, [] );

	useEffect( () => {
		if ( ! listRef.current ) {
			return;
		}

		if ( shouldStickToBottomRef.current ) {
			listRef.current.scrollTop = listRef.current.scrollHeight;
		}
	}, [ messages, isSubmitting ] );

	return (
		<div
			ref={ listRef }
			className="dewey-panel__messages"
			role="log"
			aria-live="polite"
			aria-relevant="additions text"
		>
			{ messages.map( ( message ) => (
				<div
					key={ message.id }
					className={ `dewey-message dewey-message--${ message.role }` }
				>
					<div className="dewey-message__bubble">
						{ message.role === 'assistant' ? (
							<MarkdownText text={ message.text } />
						) : (
							message.text
						) }

						{ /* Copy button — shown on all non-welcome assistant messages */ }
						{ message.role === 'assistant' &&
							message.id !== 'welcome' && (
								<CopyButton text={ message.text } />
							) }

						{ /* Relative timestamp — shown on all non-welcome messages */ }
						{ message.id !== 'welcome' && message.timestamp && (
							<span
								className="dewey-message__timestamp"
								aria-label={ getRelativeTime(
									message.timestamp
								) }
							>
								{ getRelativeTime( message.timestamp ) }
							</span>
						) }

						{ Array.isArray( message.actions ) &&
							( message.id !== 'welcome' ||
								! hasAskedStarter ) && (
								<div className="dewey-message__actions">
									{ message.actions.map( ( action ) => (
										<Button
											key={ action.id }
											variant={
												action.kind === 'followup' ||
												action.kind === 'retry'
													? 'tertiary'
													: 'secondary'
											}
											size="small"
											className={ [
												'dewey-message__action',
												action.kind === 'followup'
													? 'dewey-message__action--followup'
													: '',
												action.kind === 'retry'
													? 'dewey-message__action--retry'
													: '',
											]
												.filter( Boolean )
												.join( ' ' ) }
											onClick={ () => {
												if (
													message.id === 'welcome'
												) {
													onStarterSelect( action );
													return;
												}
												onMessageAction?.( action );
											} }
										>
											{ action.kind === 'followup' && (
												<span
													className="dewey-message__action-arrow"
													aria-hidden="true"
												>
													↳{ ' ' }
												</span>
											) }
											{ action.label }
										</Button>
									) ) }
								</div>
							) }

						{ Array.isArray( message.citations ) &&
							message.citations.length > 0 && (
								<div className="dewey-message__citations">
									{ message.citations.map( ( citation ) => (
										<div
											key={ citation.postId }
											className="dewey-message__citation-wrap"
										>
											<a
												className="dewey-message__citation"
												href={ citation.permalink }
												target="_blank"
												rel="noreferrer"
											>
												{ citationStyle === 'links'
													? citation.permalink
													: citation.title }
											</a>
											{ citation.snippet && (
												<span className="dewey-message__citation-snippet">
													{ citation.snippet.slice(
														0,
														120
													) }
													{ citation.snippet.length >
													120
														? '…'
														: '' }
												</span>
											) }
										</div>
									) ) }
								</div>
							) }
					</div>
				</div>
			) ) }
			{ isSubmitting && (
				<div
					className="dewey-message dewey-message--assistant dewey-message--thinking"
					aria-label={ __( 'Dewey is thinking', 'dewey' ) }
				>
					<div className="dewey-message__bubble">
						<span
							className="dewey-thinking-dots"
							aria-hidden="true"
						>
							<span />
							<span />
							<span />
						</span>
					</div>
				</div>
			) }
		</div>
	);
}

export default memo( MessageList );
