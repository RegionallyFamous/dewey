/**
 * MessageList.jsx
 */

import { memo, useEffect, useRef } from '@wordpress/element';
import { Button } from '@wordpress/components';

function MessageList( { messages, hasAskedStarter, onStarterSelect } ) {
	const listRef = useRef( null );

	useEffect( () => {
		if ( ! listRef.current ) {
			return;
		}

		listRef.current.scrollTop = listRef.current.scrollHeight;
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
							! hasAskedStarter && (
								<div className="dewey-message__actions">
									{ message.actions.map( ( action ) => (
										<Button
											key={ action.id }
											variant="secondary"
											size="small"
											className="dewey-message__action"
											onClick={ () =>
												onStarterSelect( action )
											}
										>
											{ action.label }
										</Button>
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
