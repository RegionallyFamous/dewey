/**
 * useNavigationCommands
 *
 * Returns fuzzy-matched admin navigation suggestions as the user types.
 * Uses Fuse.js for client-side matching against a static command registry
 * plus any items scraped from the wp-admin sidebar menu.
 */

/* global ajaxurl */

import { useState, useEffect, useRef, useCallback } from '@wordpress/element';
import Fuse from 'fuse.js';
import { commands } from './commands';

const FUSE_OPTIONS = {
	keys: [
		{ name: 'descriptions', weight: 0.75 },
		{ name: 'label', weight: 0.25 },
	],
	threshold: 0.36,
	ignoreLocation: true,
	includeScore: true,
	minMatchCharLength: 2,
};

const MIN_CHARS = 3;
const DEBOUNCE_MS = 280;
const MAX_SUGGESTIONS = 3;

function isSafeAdminUrl( url ) {
	if ( ! url || typeof url !== 'string' ) {
		return false;
	}
	return (
		/^[a-zA-Z0-9_./?=&#%+-]+$/.test( url ) &&
		! url.includes( 'javascript:' ) &&
		! url.includes( '//' )
	);
}

function scrapeAdminMenu() {
	const seen = new Set( commands.map( ( c ) => c.url ) );
	const dynamic = [];

	document
		.querySelectorAll(
			'#adminmenu a.menu-top, #adminmenu a.wp-has-submenu'
		)
		.forEach( ( el ) => {
			const href = el.getAttribute( 'href' );
			const rawLabel = el.innerText.replace( /\d+/g, '' ).trim();

			if ( ! rawLabel || ! href || seen.has( href ) ) {
				return;
			}
			if ( ! isSafeAdminUrl( href ) ) {
				return;
			}

			seen.add( href );
			dynamic.push( {
				id: `admin/${ href }`,
				label: rawLabel,
				explanation: rawLabel,
				descriptions: [ rawLabel.toLowerCase() ],
				url: href,
			} );
		} );

	return dynamic;
}

function getAdminBase() {
	if ( typeof ajaxurl !== 'undefined' ) {
		return ajaxurl.replace( 'admin-ajax.php', '' );
	}
	return '/wp-admin/';
}

export function useNavigationCommands( input ) {
	const [ suggestions, setSuggestions ] = useState( [] );
	const fuseRef = useRef( null );
	const timerRef = useRef( null );

	useEffect( () => {
		const buildIndex = ( dynamic ) => {
			fuseRef.current = new Fuse(
				[ ...commands, ...dynamic ],
				FUSE_OPTIONS
			);
		};

		if ( document.readyState === 'complete' ) {
			buildIndex( scrapeAdminMenu() );
		} else {
			window.addEventListener(
				'load',
				() => buildIndex( scrapeAdminMenu() ),
				{ once: true }
			);
			// Build with static commands immediately so the index is ready before
			// the DOM is fully loaded (sidebar may not exist yet on first load).
			buildIndex( [] );
		}
	}, [] );

	useEffect( () => {
		clearTimeout( timerRef.current );

		const trimmed = input ? input.trim() : '';

		if ( trimmed.length < MIN_CHARS ) {
			setSuggestions( [] );
			return;
		}

		timerRef.current = setTimeout( () => {
			if ( ! fuseRef.current ) {
				return;
			}

			const results = fuseRef.current.search( trimmed, {
				limit: MAX_SUGGESTIONS,
			} );

			setSuggestions(
				results.filter( ( r ) => r.item.url ).map( ( r ) => r.item )
			);
		}, DEBOUNCE_MS );

		return () => clearTimeout( timerRef.current );
	}, [ input ] );

	const navigate = useCallback( ( command ) => {
		setSuggestions( [] );

		if ( ! command.url ) {
			return;
		}

		const base = getAdminBase();
		window.location.href = command.url.startsWith( '/' )
			? command.url
			: base + command.url;
	}, [] );

	return { suggestions, navigate };
}
