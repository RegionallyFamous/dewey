/**
 * index.js
 *
 * Entry point for the Dewey admin panel.
 * Mounts the floating button + panel into the WP admin DOM.
 *
 * Built with @wordpress/scripts (webpack).
 * Run: npm run build
 */

import { render } from '@wordpress/element';
import App from './components/App';
import './components/dewey/dewey.css';
import './index.css';

// Mount when DOM is ready
window.addEventListener( 'DOMContentLoaded', () => {
	const container = document.createElement( 'div' );
	container.id = 'dewey-root';
	document.body.appendChild( container );
	render( <App />, container );
} );
