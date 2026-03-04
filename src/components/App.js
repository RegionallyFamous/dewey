/**
 * App.js
 *
 * The app uses the Dewey chat module as the single source of truth
 * for UI state, actions, and copy.
 */

import {
	DeweyFab,
	DeweyPanel,
	useDeweyChat,
	useNavigationCommands,
} from './dewey';

export default function App() {
	const {
		isOpen,
		inputValue,
		messages,
		hasAskedStarter,
		isSubmitting,
		isAiConnected,
		connectionDebug,
		citationStyle,
		inputRef,
		setInputValue,
		togglePanel,
		closePanel,
		clearConversation,
		handleStarter,
		handleMessageAction,
		handleSubmit,
	} = useDeweyChat();

	const { suggestions: navSuggestions, navigate: handleNavigate } =
		useNavigationCommands( isOpen ? inputValue : '' );

	return (
		<div className="dewey-app">
			<DeweyFab isOpen={ isOpen } onToggle={ togglePanel } />
			{ isOpen && (
				<DeweyPanel
					messages={ messages }
					hasAskedStarter={ hasAskedStarter }
					isSubmitting={ isSubmitting }
					isAiConnected={ isAiConnected }
					connectionDebug={ connectionDebug }
					onStarterSelect={ handleStarter }
					onMessageAction={ handleMessageAction }
					onClose={ closePanel }
					onClearConversation={ clearConversation }
					citationStyle={ citationStyle }
					onSubmit={ handleSubmit }
					inputRef={ inputRef }
					inputValue={ inputValue }
					onInputChange={ setInputValue }
					navSuggestions={ navSuggestions }
					onNavigate={ handleNavigate }
				/>
			) }
		</div>
	);
}
