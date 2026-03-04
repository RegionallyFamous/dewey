// @jest-environment jsdom

import { render } from '@testing-library/react';
import MarkdownText from './MarkdownText';

describe( 'MarkdownText', () => {
	it( 'renders common markdown formatting safely', () => {
		const { container, getByText } = render(
			<MarkdownText
				text={
					'# Heading\n\n- First item\n- Second item\n\nThis has **bold** and `code` and a [link](https://example.com).'
				}
			/>
		);

		expect( getByText( 'Heading' ) ).not.toBeNull();
		expect( container.querySelectorAll( 'ul li' ).length ).toBe( 2 );
		expect( container.querySelector( 'strong' )?.textContent ).toBe(
			'bold'
		);
		expect( container.querySelector( 'code' )?.textContent ).toBe( 'code' );
		expect( container.querySelector( 'a' )?.getAttribute( 'href' ) ).toBe(
			'https://example.com'
		);
	} );
} );
