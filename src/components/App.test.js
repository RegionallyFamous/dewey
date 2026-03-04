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
		const { container, getByRole, queryByRole, getByLabelText } = render(
			<App />
		);
		const fab = container.querySelector( '.dewey-fab' );

		expect( fab ).not.toBeNull();
		expect( queryByRole( 'dialog' ) ).toBeNull();

		fireEvent.click( fab );
		expect( getByRole( 'dialog' ) ).not.toBeNull();

		fireEvent.click( getByLabelText( 'Close Dewey panel' ) );
		expect( queryByRole( 'dialog' ) ).toBeNull();

		fireEvent.click( fab );
		expect( getByRole( 'dialog' ) ).not.toBeNull();
	} );

	it( 'auto-opens on first load with welcome and starter prompts', () => {
		window.localStorage.clear();
		const firstOpenHandlers = createDeweyHandlers();
		useDewey.mockReturnValue( {
			deweyState: 'hello',
			deweyHandlers: firstOpenHandlers,
		} );

		const { getByRole, getByText } = render( <App /> );
		expect( getByRole( 'dialog' ) ).not.toBeNull();
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

		const { container, getByRole, getByPlaceholderText, getByText } =
			render( <App /> );
		const fab = container.querySelector( '.dewey-fab' );

		fireEvent.click( fab );
		expect( getByRole( 'dialog' ) ).not.toBeNull();

		const input = getByPlaceholderText( /Ask Dewey/ );
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
		const { container, getByRole, queryByRole } = render( <App /> );
		const fab = container.querySelector( '.dewey-fab' );

		fireEvent.click( fab );
		expect( getByRole( 'dialog' ) ).not.toBeNull();

		fireEvent.keyDown( window, { key: 'Escape' } );
		expect( queryByRole( 'dialog' ) ).toBeNull();
	} );

	it( 'renders live query answer and citation when connected', async () => {
		window.deweyConfig = {
			aiConnected: true,
			restBase: 'https://example.com/wp-json/dewey/v1',
			nonce: 'valid-nonce',
		};
		window.fetch = jest.fn().mockResolvedValue( {
			ok: true,
			json: async () => ( {
				answer: 'Your strongest onboarding article is still relevant.',
				citations: [
					{
						post_id: 9,
						title: 'Onboarding Guide',
						permalink: 'https://example.com/onboarding-guide',
						snippet: 'Start with expectations and first wins.',
					},
				],
			} ),
		} );

		const { container, findByText, getByPlaceholderText } = render(
			<App />
		);
		const fab = container.querySelector( '.dewey-fab' );
		fireEvent.click( fab );

		const input = getByPlaceholderText( /Ask Dewey/ );
		fireEvent.change( input, {
			target: { value: 'What was our onboarding guidance?' },
		} );
		fireEvent.submit( input.closest( 'form' ) );

		expect(
			await findByText(
				'Your strongest onboarding article is still relevant.'
			)
		).not.toBeNull();
		expect( await findByText( 'Onboarding Guide' ) ).not.toBeNull();
	} );
} );
