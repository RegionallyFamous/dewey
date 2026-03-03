// @jest-environment jsdom

import { fireEvent, render } from '@testing-library/react';
import App from './App';
import {
	FIRST_OPEN_MESSAGE,
	NO_AI_MESSAGE,
	STARTER_ACTIONS,
} from './dewey/copy';
import { useDewey } from './dewey/useDewey';

jest.mock( './dewey/useDewey', () => ( {
	useDewey: jest.fn(),
} ) );

function createDeweyHandlers() {
	return {
		onQueryStart: jest.fn(),
		onPostsFound: jest.fn(),
		onAnswerReady: jest.fn(),
		onNoResults: jest.fn(),
		onError: jest.fn(),
		onShock: jest.fn(),
		onFirstOpen: jest.fn(),
		onTired: jest.fn(),
		setDewey: jest.fn(),
	};
}

describe( 'App integration', () => {
	beforeEach( () => {
		window.localStorage.clear();
		window.localStorage.setItem( 'dewey.hasOpenedOnce', '1' );
		window.deweyConfig = { aiConnected: false };

		useDewey.mockReturnValue( {
			deweyState: 'idle',
			deweyHandlers: createDeweyHandlers(),
		} );
	} );

	it( 'opens with FAB, closes with panel close button, reopens with FAB', () => {
		const { container, getByLabelText, queryByLabelText } = render(
			<App />
		);
		const fab = container.querySelector( '.dewey-fab' );

		expect( fab ).not.toBeNull();
		expect( queryByLabelText( 'Dewey panel' ) ).toBeNull();

		fireEvent.click( fab );
		expect( getByLabelText( 'Dewey panel' ) ).not.toBeNull();

		fireEvent.click( getByLabelText( 'Close Dewey panel' ) );
		expect( queryByLabelText( 'Dewey panel' ) ).toBeNull();

		fireEvent.click( fab );
		expect( getByLabelText( 'Dewey panel' ) ).not.toBeNull();
	} );

	it( 'auto-opens on first load with welcome and starter prompts', () => {
		window.localStorage.clear();
		const firstOpenHandlers = createDeweyHandlers();
		useDewey.mockReturnValue( {
			deweyState: 'hello',
			deweyHandlers: firstOpenHandlers,
		} );

		const { getByLabelText, getByText } = render( <App /> );
		expect( getByLabelText( 'Dewey panel' ) ).not.toBeNull();
		expect( getByText( FIRST_OPEN_MESSAGE ) ).not.toBeNull();
		expect( getByText( STARTER_ACTIONS[ 0 ].label ) ).not.toBeNull();
		expect( firstOpenHandlers.onFirstOpen ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'shows no-AI fallback after non-starter submit', () => {
		window.localStorage.setItem( 'dewey.hasOpenedOnce', '1' );
		window.deweyConfig = { aiConnected: false };
		const disconnectedHandlers = createDeweyHandlers();
		useDewey.mockReturnValue( {
			deweyState: 'idle',
			deweyHandlers: disconnectedHandlers,
		} );

		const { container, getByLabelText, getByPlaceholderText, getByText } =
			render( <App /> );
		const fab = container.querySelector( '.dewey-fab' );

		fireEvent.click( fab );
		expect( getByLabelText( 'Dewey panel' ) ).not.toBeNull();

		const input = getByPlaceholderText( 'Ask Dewey...' );
		fireEvent.change( input, {
			target: {
				value: 'Give me a summary of my strongest onboarding posts.',
			},
		} );
		fireEvent.submit( input.closest( 'form' ) );

		expect( getByText( NO_AI_MESSAGE ) ).not.toBeNull();
		expect( disconnectedHandlers.onQueryStart ).toHaveBeenCalledTimes( 1 );
		expect( disconnectedHandlers.onNoResults ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'closes the panel with Escape key', () => {
		const { container, getByLabelText, queryByLabelText } = render(
			<App />
		);
		const fab = container.querySelector( '.dewey-fab' );

		fireEvent.click( fab );
		expect( getByLabelText( 'Dewey panel' ) ).not.toBeNull();

		fireEvent.keyDown( window, { key: 'Escape' } );
		expect( queryByLabelText( 'Dewey panel' ) ).toBeNull();
	} );
} );
