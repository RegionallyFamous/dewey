/**
 * App.js
 *
 * The app uses the Dewey chat module as the single source of truth
 * for UI state, actions, and copy.
 */

import { DeweyFab, DeweyPanel, useDeweyChat } from './dewey';

export default function App() {
	const {
		isOpen,
		inputValue,
		messages,
		hasAskedStarter,
		isSubmitting,
		isAiConnected,
		inputRef,
		setInputValue,
		togglePanel,
		closePanel,
		handleStarter,
		handleMessageAction,
		handleSubmit,
	} = useDeweyChat();

	return (
		<div className="dewey-app">
			<DeweyFab isOpen={ isOpen } onToggle={ togglePanel } />
			{ isOpen && (
				<DeweyPanel
					messages={ messages }
					hasAskedStarter={ hasAskedStarter }
					isSubmitting={ isSubmitting }
					isAiConnected={ isAiConnected }
					onStarterSelect={ handleStarter }
					onMessageAction={ handleMessageAction }
					onClose={ closePanel }
					onSubmit={ handleSubmit }
					inputRef={ inputRef }
					inputValue={ inputValue }
					onInputChange={ setInputValue }
				/>
			) }
		</div>
	);
}
