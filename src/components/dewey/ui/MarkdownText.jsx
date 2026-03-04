/**
 * MarkdownText.jsx
 *
 * Safe, lightweight markdown renderer for Dewey assistant messages.
 * Supports headings, paragraphs, lists, blockquotes, code fences,
 * inline code, emphasis, and links without using raw HTML sinks.
 */

import { Fragment, memo, useMemo } from '@wordpress/element';

function safeHref( href ) {
	if ( typeof href !== 'string' || href.trim() === '' ) {
		return '';
	}

	const value = href.trim();
	if ( value.startsWith( '/' ) || value.startsWith( '#' ) ) {
		return value;
	}

	try {
		const parsed = new URL( value );
		if (
			parsed.protocol === 'http:' ||
			parsed.protocol === 'https:' ||
			parsed.protocol === 'mailto:'
		) {
			return value;
		}
	} catch ( e ) {
		return '';
	}

	return '';
}

function renderInline( text ) {
	const source = String( text ?? '' );
	const tokens = [];
	const pattern =
		/(\[[^\]]+\]\([^)]+\)|`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*\n]+\*|_[^_\n]+_)/g;
	let lastIndex = 0;
	let match;

	while ( ( match = pattern.exec( source ) ) ) {
		if ( match.index > lastIndex ) {
			tokens.push( source.slice( lastIndex, match.index ) );
		}
		tokens.push( match[ 0 ] );
		lastIndex = pattern.lastIndex;
	}
	if ( lastIndex < source.length ) {
		tokens.push( source.slice( lastIndex ) );
	}

	return tokens.map( ( token, index ) => {
		const key = `inline-${ index }`;
		if ( token.startsWith( '`' ) && token.endsWith( '`' ) ) {
			return <code key={ key }>{ token.slice( 1, -1 ) }</code>;
		}
		if (
			( token.startsWith( '**' ) && token.endsWith( '**' ) ) ||
			( token.startsWith( '__' ) && token.endsWith( '__' ) )
		) {
			return <strong key={ key }>{ token.slice( 2, -2 ) }</strong>;
		}
		if (
			( token.startsWith( '*' ) && token.endsWith( '*' ) ) ||
			( token.startsWith( '_' ) && token.endsWith( '_' ) )
		) {
			return <em key={ key }>{ token.slice( 1, -1 ) }</em>;
		}
		if (
			token.startsWith( '[' ) &&
			token.includes( '](' ) &&
			token.endsWith( ')' )
		) {
			const boundary = token.indexOf( '](' );
			const label = token.slice( 1, boundary );
			const href = safeHref( token.slice( boundary + 2, -1 ) );
			if ( ! href ) {
				return token;
			}
			return (
				<a key={ key } href={ href } target="_blank" rel="noreferrer">
					{ label }
				</a>
			);
		}
		return <Fragment key={ key }>{ token }</Fragment>;
	} );
}

function renderParagraph( text, key ) {
	return <p key={ key }>{ renderInline( text ) }</p>;
}

function MarkdownText( { text } ) {
	const nodes = useMemo( () => {
		const lines = String( text ?? '' )
			.replace( /\r\n/g, '\n' )
			.split( '\n' );
		const renderedNodes = [];
		let i = 0;

		while ( i < lines.length ) {
			const line = lines[ i ];
			const trimmed = line.trim();

			if ( trimmed === '' ) {
				i++;
				continue;
			}

			if ( trimmed.startsWith( '```' ) ) {
				const block = [];
				i++;
				while (
					i < lines.length &&
					! lines[ i ].trim().startsWith( '```' )
				) {
					block.push( lines[ i ] );
					i++;
				}
				if ( i < lines.length ) {
					i++;
				}
				renderedNodes.push(
					<pre key={ `pre-${ i }` }>
						<code>{ block.join( '\n' ) }</code>
					</pre>
				);
				continue;
			}

			if ( /^#{1,3}\s/.test( trimmed ) ) {
				const level = trimmed.match( /^#+/ )[ 0 ].length;
				const content = trimmed.replace( /^#{1,3}\s+/, '' );
				if ( level === 1 ) {
					renderedNodes.push(
						<h3 key={ `h-${ i }` }>{ renderInline( content ) }</h3>
					);
				} else if ( level === 2 ) {
					renderedNodes.push(
						<h4 key={ `h-${ i }` }>{ renderInline( content ) }</h4>
					);
				} else {
					renderedNodes.push(
						<h5 key={ `h-${ i }` }>{ renderInline( content ) }</h5>
					);
				}
				i++;
				continue;
			}

			if ( /^>\s?/.test( trimmed ) ) {
				renderedNodes.push(
					<blockquote key={ `q-${ i }` }>
						{ renderInline( trimmed.replace( /^>\s?/, '' ) ) }
					</blockquote>
				);
				i++;
				continue;
			}

			if ( /^[-*]\s+/.test( trimmed ) ) {
				const items = [];
				while (
					i < lines.length &&
					/^[-*]\s+/.test( lines[ i ].trim() )
				) {
					items.push( lines[ i ].trim().replace( /^[-*]\s+/, '' ) );
					i++;
				}
				renderedNodes.push(
					<ul key={ `ul-${ i }` }>
						{ items.map( ( item, index ) => (
							<li key={ `li-${ index }` }>
								{ renderInline( item ) }
							</li>
						) ) }
					</ul>
				);
				continue;
			}

			if ( /^\d+\.\s+/.test( trimmed ) ) {
				const items = [];
				while (
					i < lines.length &&
					/^\d+\.\s+/.test( lines[ i ].trim() )
				) {
					items.push( lines[ i ].trim().replace( /^\d+\.\s+/, '' ) );
					i++;
				}
				renderedNodes.push(
					<ol key={ `ol-${ i }` }>
						{ items.map( ( item, index ) => (
							<li key={ `oli-${ index }` }>
								{ renderInline( item ) }
							</li>
						) ) }
					</ol>
				);
				continue;
			}

			const paragraphLines = [ trimmed ];
			i++;
			while ( i < lines.length ) {
				const next = lines[ i ].trim();
				if (
					next === '' ||
					next.startsWith( '```' ) ||
					/^#{1,3}\s/.test( next ) ||
					/^>\s?/.test( next ) ||
					/^[-*]\s+/.test( next ) ||
					/^\d+\.\s+/.test( next )
				) {
					break;
				}
				paragraphLines.push( next );
				i++;
			}
			renderedNodes.push(
				renderParagraph( paragraphLines.join( ' ' ), `p-${ i }` )
			);
		}

		return renderedNodes;
	}, [ text ] );
	return <div className="dewey-markdown">{ nodes }</div>;
}

export default memo( MarkdownText );
