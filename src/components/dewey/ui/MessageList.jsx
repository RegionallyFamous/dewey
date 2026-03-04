/**
 * MessageList.jsx
 */

import { memo, useEffect, useRef } from '@wordpress/element';
import { Button } from '@wordpress/components';

function MessageList( {
	messages,
	hasAskedStarter,
	onStarterSelect,
	onMessageAction,
} ) {
	const listRef = useRef( null );
	const shouldStickToBottomRef = useRef( true );

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
	}, [ messages ] );

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
						{ message.text }
						{ Array.isArray( message.actions ) &&
							( message.id !== 'welcome' ||
								! hasAskedStarter ) && (
								<div className="dewey-message__actions">
									{ message.actions.map( ( action ) => (
										<Button
											key={ action.id }
											variant="secondary"
											size="small"
											className="dewey-message__action"
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
											{ action.label }
										</Button>
									) ) }
								</div>
							) }
						{ Array.isArray( message.citations ) &&
							message.citations.length > 0 && (
								<div className="dewey-message__citations">
									{ message.citations.map( ( citation ) => (
										<a
											key={ citation.postId }
											className="dewey-message__citation"
											href={ citation.permalink }
											target="_blank"
											rel="noreferrer"
										>
											{ citation.title }
										</a>
									) ) }
								</div>
							) }
					</div>
				</div>
			) ) }
		</div>
	);
}

export default memo( MessageList );
