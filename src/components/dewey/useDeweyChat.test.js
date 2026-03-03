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

	it( 'sanitizes user input before submit', () => {
		window.deweyConfig = { aiConnected: false };
		const { result } = renderHook( () => useDeweyChat() );
		const oversized = `hello\u0001\u0007${ 'x'.repeat( 700 ) }`;

		act( () => {
			result.current.setInputValue( oversized );
		} );

		expect( result.current.inputValue.includes( '\u0001' ) ).toBe( false );
		expect( result.current.inputValue.includes( '\u0007' ) ).toBe( false );
		expect( result.current.inputValue.length ).toBe( 500 );

		act( () => {
			result.current.handleSubmit( { preventDefault: jest.fn() } );
		} );

		const userMessage = result.current.messages.find(
			( message ) => message.role === 'user'
		);
		expect( userMessage ).toBeDefined();
		expect( userMessage.text.length ).toBe( 500 );
		expect( userMessage.text.includes( '\u0001' ) ).toBe( false );
		expect( userMessage.text.includes( '\u0007' ) ).toBe( false );
	} );

	it( 'throttles rapid submits to reduce abuse/flooding', () => {
		window.deweyConfig = { aiConnected: false };
		const nowSpy = jest.spyOn( Date, 'now' );
		nowSpy.mockReturnValue( 1000 );
		const { result } = renderHook( () => useDeweyChat() );

		act( () => {
			result.current.setInputValue( 'First question' );
			result.current.handleSubmit( { preventDefault: jest.fn() } );
		} );

		act( () => {
			result.current.setInputValue( 'Second question too fast' );
			nowSpy.mockReturnValue( 1500 );
			result.current.handleSubmit( { preventDefault: jest.fn() } );
		} );

		const userMessages = result.current.messages.filter(
			( message ) => message.role === 'user'
		);
		expect( userMessages ).toHaveLength( 1 );
		expect( handlers.onQueryStart ).toHaveBeenCalledTimes( 1 );
		nowSpy.mockRestore();
	} );

	it( 'caps chat history length while preserving welcome message', () => {
		window.deweyConfig = { aiConnected: false };
		const nowSpy = jest.spyOn( Date, 'now' );
		nowSpy.mockImplementation( () => 5000 );
		const { result } = renderHook( () => useDeweyChat() );

		for ( let i = 0; i < 45; i++ ) {
			act( () => {
				result.current.setInputValue( `Question ${ i }` );
				nowSpy.mockReturnValue( 5000 + i * 1000 );
				result.current.handleSubmit( { preventDefault: jest.fn() } );
			} );
		}

		expect( result.current.messages[ 0 ].id ).toBe( 'welcome' );
		expect( result.current.messages.length ).toBeLessThanOrEqual( 80 );
		nowSpy.mockRestore();
	} );
} );
