// @jest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { NO_AI_MESSAGE, STARTER_ACTIONS, STORAGE_KEYS } from './copy';
import { useDeweyChat } from './useDeweyChat';
import { useDewey } from './useDewey';

jest.mock( './useDewey', () => ( {
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

describe( 'useDeweyChat', () => {
	let handlers;

	beforeEach( () => {
		jest.clearAllMocks();
		window.localStorage.clear();
		window.deweyConfig = undefined;
		window.wp = undefined;
		handlers = createDeweyHandlers();
		useDewey.mockReturnValue( {
			deweyState: 'idle',
			deweyHandlers: handlers,
		} );
	} );

	it( 'opens on first run and marks localStorage', () => {
		const { result } = renderHook( () => useDeweyChat() );

		expect( result.current.isOpen ).toBe( true );
		expect( handlers.onFirstOpen ).toHaveBeenCalledTimes( 1 );
		expect( window.localStorage.getItem( STORAGE_KEYS.openedOnce ) ).toBe(
			'1'
		);
	} );

	it( 'adds starter prompt conversation in Dewey voice', () => {
		const { result } = renderHook( () => useDeweyChat() );

		act( () => {
			result.current.handleStarter( STARTER_ACTIONS[ 0 ] );
		} );

		const texts = result.current.messages.map(
			( message ) => message.text
		);
		expect( result.current.hasAskedStarter ).toBe( true );
		expect( texts ).toContain( STARTER_ACTIONS[ 0 ].label );
		expect( texts ).toContain( STARTER_ACTIONS[ 0 ].reply );
		expect( handlers.onAnswerReady ).toHaveBeenCalledWith( 1 );
	} );

	it( 'responds with no-AI guidance for regular questions', () => {
		window.deweyConfig = { aiConnected: false };
		const { result } = renderHook( () => useDeweyChat() );

		act( () => {
			result.current.setInputValue(
				'What is my best post on onboarding?'
			);
		} );

		act( () => {
			result.current.handleSubmit( { preventDefault: jest.fn() } );
		} );

		const lastMessage =
			result.current.messages[ result.current.messages.length - 1 ];
		expect( handlers.onQueryStart ).toHaveBeenCalledTimes( 1 );
		expect( handlers.onNoResults ).toHaveBeenCalledTimes( 1 );
		expect( lastMessage.role ).toBe( 'assistant' );
		expect( lastMessage.text ).toBe( NO_AI_MESSAGE );
	} );
} );
