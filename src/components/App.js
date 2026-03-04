/**
 * App.js
 *
 * The app uses the Dewey chat module as the single source of truth
 * for UI state, actions, and copy.
 */

import { useCallback } from '@wordpress/element';
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

	const {
		suggestions: navSuggestions,
		navigate: handleNavigate,
		getTopNavMatch,
	} = useNavigationCommands( isOpen ? inputValue : '' );

	// Before firing the AI query, check whether the user's intent is clearly
	// navigational. If we get a high-confidence command match, go there instead.
	const handleSubmitOrNavigate = useCallback(
		( e ) => {
			const navMatch = getTopNavMatch( inputValue );
			if ( navMatch ) {
				e.preventDefault();
				handleNavigate( navMatch );
				return;
			}
			handleSubmit( e );
		},
		[ inputValue, getTopNavMatch, handleNavigate, handleSubmit ]
	);

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
					onSubmit={ handleSubmitOrNavigate }
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
