/**
 * MessageList.jsx
 */

export default function MessageList( {
	messages,
	hasAskedStarter,
	onStarterSelect,
} ) {
	return (
		<div className="dewey-panel__messages" role="log" aria-live="polite">
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
										<button
											key={ action.id }
											type="button"
											className="dewey-message__action"
											onClick={ () =>
												onStarterSelect( action )
											}
										>
											{ action.label }
										</button>
									) ) }
								</div>
							) }
					</div>
				</div>
			) ) }
		</div>
	);
}
