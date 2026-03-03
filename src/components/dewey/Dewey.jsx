/**
 * Dewey.jsx
 *
 * The Dewey character component for the Librarian WordPress plugin.
 * A friendly animated character that reacts to query states.
 */

import { memo, useEffect, useMemo, useRef, useState } from '@wordpress/element';

const STATE_CONFIG = {
	idle: {
		speech: 'Ask me anything about your archive! 📚',
		mouth: 'happy',
		brows: 'normal',
		particles: [ '📖' ],
		loop: false,
	},
	searching: {
		speech: "Ooh let me check - I've read everything! 🔍",
		mouth: 'happy',
		brows: 'normal',
		particles: [ '🔍', '📄', '📝' ],
		loop: false,
	},
	thinking: {
		speech: 'Hmm... flipping through my memory... 🤔',
		mouth: 'happy',
		brows: 'thinking',
		particles: [ '💭', '📖' ],
		loop: false,
	},
	found: {
		speech: 'Found it! Here are your posts! ✨',
		mouth: 'happy',
		brows: 'normal',
		particles: [ '✨', '⭐', '💡', '🎉' ],
		loop: true,
	},
	dancing: {
		speech: 'Your archive is INCREDIBLE!! 🕺',
		mouth: 'happy',
		brows: 'normal',
		particles: [ '🎉', '🎊', '⭐', '✨', '🎈' ],
		loop: true,
	},
	sad: {
		speech: "Oh no... I couldn't find anything... 😢",
		mouth: 'sad',
		brows: 'sad',
		particles: [ '💧' ],
		loop: false,
	},
	shocked: {
		speech: 'Wait - you wrote THAT in 2019?! 😱',
		mouth: 'shocked',
		brows: 'shocked',
		particles: [ '😱', '❗' ],
		loop: false,
	},
	hello: {
		speech: "Hi!! I'm Dewey! I've read ALL your posts! 👋",
		mouth: 'happy',
		brows: 'normal',
		particles: [ '👋', '🌟', '📚', '✨' ],
		loop: true,
	},
	tired: {
		speech: 'That was... a lot of posts... zZz 😴',
		mouth: 'happy',
		brows: 'sad',
		particles: [ '💤', '😴' ],
		loop: false,
	},
};

const BROW_PATHS = {
	normal: [ 'M62 58 Q74 54 86 58', 'M84 58 Q96 54 108 58' ],
	thinking: [ 'M62 57 Q74 54 86 58', 'M84 58 Q96 54 108 57' ],
	sad: [ 'M62 61 Q74 58 86 61', 'M84 61 Q96 58 108 61' ],
	shocked: [ 'M62 54 Q74 50 86 54', 'M84 54 Q96 50 108 54' ],
};

const PAGE_LINE_YS = [ 75, 83, 91, 99, 107, 115, 123, 131 ];
const THEME_ACCENT = 'var(--wp-admin-theme-color, #2271b1)';
const THEME_ACCENT_DARK = 'var(--wp-admin-theme-color-darker-10, #135e96)';
const DEWEY_BASE_900 = 'var(--dewey-base-900, #1b4332)';
const DEWEY_BASE_850 = 'var(--dewey-base-850, #243d30)';
const DEWEY_BASE_700 = 'var(--dewey-base-700, #2d6a4f)';
const DEWEY_BASE_600 = 'var(--dewey-base-600, #3d8a6a)';
const DEWEY_PAPER_100 = 'var(--dewey-paper-100, #fdf6e3)';
const DEWEY_PAPER_200 = 'var(--dewey-paper-200, #f5edd6)';
const DEWEY_PAPER_LINE = 'var(--dewey-paper-line, #c4b898)';
const DEWEY_PAPER_SPINE = 'var(--dewey-paper-spine, #b0a07a)';
const DEWEY_BLUSH = 'var(--dewey-blush, rgba(205,110,80,0.26))';
const DEWEY_PUPIL_DARK = 'var(--dewey-pupil-dark, #0d2015)';
const DEWEY_PUPIL_LIGHT = 'var(--dewey-pupil-light, #1e4a2a)';
const DEFAULT_ACCENT_HEX = '#2271b1';

function clampChannel( value ) {
	return Math.max( 0, Math.min( 255, Math.round( value ) ) );
}

function parseHexColor( color ) {
	const raw = color.trim().replace( '#', '' );
	if ( raw.length === 3 ) {
		const [ r, g, b ] = raw.split( '' );
		return {
			r: parseInt( `${ r }${ r }`, 16 ),
			g: parseInt( `${ g }${ g }`, 16 ),
			b: parseInt( `${ b }${ b }`, 16 ),
		};
	}
	if ( raw.length === 6 ) {
		return {
			r: parseInt( raw.slice( 0, 2 ), 16 ),
			g: parseInt( raw.slice( 2, 4 ), 16 ),
			b: parseInt( raw.slice( 4, 6 ), 16 ),
		};
	}
	return null;
}

function parseRgbColor( color ) {
	const match = color
		.trim()
		.match( /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i );
	if ( ! match ) {
		return null;
	}
	return {
		r: clampChannel( Number( match[ 1 ] ) ),
		g: clampChannel( Number( match[ 2 ] ) ),
		b: clampChannel( Number( match[ 3 ] ) ),
	};
}

function parseColor( color ) {
	if ( ! color || typeof color !== 'string' ) {
		return null;
	}
	if ( color.trim().startsWith( '#' ) ) {
		return parseHexColor( color );
	}
	if ( color.trim().startsWith( 'rgb' ) ) {
		return parseRgbColor( color );
	}
	return null;
}

function mix( from, to, amount ) {
	return {
		r: clampChannel( from.r + ( to.r - from.r ) * amount ),
		g: clampChannel( from.g + ( to.g - from.g ) * amount ),
		b: clampChannel( from.b + ( to.b - from.b ) * amount ),
	};
}

function shade( color, amount ) {
	if ( amount >= 0 ) {
		return mix( color, { r: 255, g: 255, b: 255 }, amount );
	}
	return mix( color, { r: 0, g: 0, b: 0 }, Math.abs( amount ) );
}

function toHex( color ) {
	const toPair = ( value ) =>
		clampChannel( value ).toString( 16 ).padStart( 2, '0' );
	return `#${ toPair( color.r ) }${ toPair( color.g ) }${ toPair(
		color.b
	) }`;
}

function toRgba( color, alpha ) {
	return `rgba(${ clampChannel( color.r ) }, ${ clampChannel(
		color.g
	) }, ${ clampChannel( color.b ) }, ${ alpha })`;
}

function getRelativeLuminance( color ) {
	const toLinear = ( channel ) => {
		const value = channel / 255;
		return value <= 0.03928
			? value / 12.92
			: Math.pow( ( value + 0.055 ) / 1.055, 2.4 );
	};
	const r = toLinear( color.r );
	const g = toLinear( color.g );
	const b = toLinear( color.b );
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function isDarkAdminScheme() {
	if ( typeof document === 'undefined' || ! document.body ) {
		return false;
	}

	const classes = document.body.classList;
	return (
		classes.contains( 'admin-color-midnight' ) ||
		classes.contains( 'admin-color-ocean' ) ||
		classes.contains( 'admin-color-coffee' ) ||
		classes.contains( 'admin-color-ectoplasm' )
	);
}

function getAdminAccentColor() {
	if ( typeof window === 'undefined' ) {
		return parseHexColor( DEFAULT_ACCENT_HEX );
	}
	const rootStyles = window.getComputedStyle?.( document.documentElement );
	const fromVar = rootStyles
		?.getPropertyValue( '--wp-admin-theme-color' )
		?.trim();
	return parseColor( fromVar ) || parseHexColor( DEFAULT_ACCENT_HEX );
}

function getDeweyThemeVars() {
	const accent = getAdminAccentColor();
	const accentLuminance = getRelativeLuminance( accent );
	const treatAsDarkScheme = isDarkAdminScheme() || accentLuminance < 0.2;
	const tone = treatAsDarkScheme
		? {
				base900: -0.46,
				base850: -0.38,
				base700: -0.22,
				base600: -0.08,
				paper100: 0.94,
				paper200: 0.9,
				paperLine: 0.68,
				paperSpine: 0.56,
				pupilDark: -0.64,
				pupilLight: -0.5,
				blushMix: 0.38,
				blushAlpha: 0.3,
		  }
		: {
				base900: -0.56,
				base850: -0.48,
				base700: -0.34,
				base600: -0.18,
				paper100: 0.9,
				paper200: 0.84,
				paperLine: 0.62,
				paperSpine: 0.5,
				pupilDark: -0.72,
				pupilLight: -0.58,
				blushMix: 0.32,
				blushAlpha: 0.26,
		  };

	return {
		'--dewey-accent': toHex( accent ),
		'--dewey-accent-dark': toHex( shade( accent, -0.2 ) ),
		'--dewey-accent-soft': toRgba( accent, 0.24 ),
		'--dewey-accent-glow': toRgba( accent, 0.62 ),
		'--dewey-base-900': toHex( shade( accent, tone.base900 ) ),
		'--dewey-base-850': toHex( shade( accent, tone.base850 ) ),
		'--dewey-base-700': toHex( shade( accent, tone.base700 ) ),
		'--dewey-base-600': toHex( shade( accent, tone.base600 ) ),
		'--dewey-paper-100': toHex( shade( accent, tone.paper100 ) ),
		'--dewey-paper-200': toHex( shade( accent, tone.paper200 ) ),
		'--dewey-paper-line': toHex( shade( accent, tone.paperLine ) ),
		'--dewey-paper-spine': toHex( shade( accent, tone.paperSpine ) ),
		'--dewey-blush': toRgba(
			mix( accent, { r: 205, g: 110, b: 80 }, tone.blushMix ),
			tone.blushAlpha
		),
		'--dewey-pupil-dark': toHex( shade( accent, tone.pupilDark ) ),
		'--dewey-pupil-light': toHex( shade( accent, tone.pupilLight ) ),
	};
}

function prefersReducedMotion() {
	if (
		typeof window === 'undefined' ||
		typeof window.matchMedia !== 'function'
	) {
		return false;
	}

	return window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;
}

const Particle = memo( function Particle( { emoji, style } ) {
	return (
		<div className="dewey-particle" style={ style }>
			{ emoji }
		</div>
	);
} );

function Dewey( {
	state = 'idle',
	onSpeechChange,
	className = '',
	showSpeech = true,
	showParticles = true,
	size = 170,
	speech,
} ) {
	const [ particles, setParticles ] = useState( [] );
	const [ currentSpeech, setCurrentSpeech ] = useState(
		STATE_CONFIG[ state ]?.speech ?? STATE_CONFIG.idle.speech
	);
	const particleIntervalRef = useRef( null );
	const particleCleanupRef = useRef( null );
	const particleIdRef = useRef( 0 );
	const reducedMotion = useMemo( () => prefersReducedMotion(), [] );

	const safeState = STATE_CONFIG[ state ] ? state : 'idle';
	const config = STATE_CONFIG[ safeState ];

	useEffect( () => {
		const nextSpeech = speech ?? config.speech;
		setCurrentSpeech( nextSpeech );
		onSpeechChange?.( nextSpeech );
	}, [ config.speech, onSpeechChange, safeState, speech ] );

	useEffect( () => {
		if ( particleIntervalRef.current ) {
			clearInterval( particleIntervalRef.current );
			particleIntervalRef.current = null;
		}
		if ( particleCleanupRef.current ) {
			clearTimeout( particleCleanupRef.current );
			particleCleanupRef.current = null;
		}

		setParticles( [] );

		if (
			! showParticles ||
			reducedMotion ||
			config.particles.length === 0
		) {
			return undefined;
		}

		const spawn = () => {
			const count = Math.min( config.particles.length, 4 );
			const newParticles = [];

			for ( let i = 0; i < count; i++ ) {
				const id = ++particleIdRef.current;
				const animIndex = Math.floor( Math.random() * 4 ) + 1;
				const duration = 1.2 + Math.random() * 0.7;
				const left = 55 + Math.random() * 60;
				const top = 45 + Math.random() * 55;
				const fontSize = 0.8 + Math.random() * 0.55;

				newParticles.push( {
					id,
					emoji: config.particles[ i % config.particles.length ],
					style: {
						left: `${ left }px`,
						top: `${ top }px`,
						fontSize: `${ fontSize }rem`,
						animation: `dewey-pf${ animIndex } ${ duration }s ease-out forwards`,
					},
					removeAt: Date.now() + duration * 1000,
				} );
			}

			setParticles( ( prev ) => [ ...prev, ...newParticles ] );

			particleCleanupRef.current = setTimeout( () => {
				setParticles( ( prev ) =>
					prev.filter(
						( particle ) => particle.removeAt > Date.now()
					)
				);
			}, 2000 );
		};

		spawn();

		if ( config.loop ) {
			particleIntervalRef.current = setInterval( spawn, 1100 );
		}

		return () => {
			if ( particleIntervalRef.current ) {
				clearInterval( particleIntervalRef.current );
			}
			if ( particleCleanupRef.current ) {
				clearTimeout( particleCleanupRef.current );
			}
		};
	}, [
		config.loop,
		config.particles,
		reducedMotion,
		safeState,
		showParticles,
	] );

	const browPaths = BROW_PATHS[ config.brows ] ?? BROW_PATHS.normal;
	const scale = size / 170;
	const themeVars = useMemo( () => getDeweyThemeVars(), [] );
	const characterStyle = useMemo(
		() => ( { '--dewey-scale': scale, ...themeVars } ),
		[ scale, themeVars ]
	);
	const wrapStyle = useMemo(
		() => ( { width: `${ size }px`, height: `${ size + 20 }px` } ),
		[ size ]
	);
	const svgStyle = useMemo(
		() => ( {
			width: `${ size }px`,
			height: `${ size + 20 }px`,
			overflow: 'visible',
		} ),
		[ size ]
	);

	return (
		<div
			className={ `dewey-character ${ className }` }
			style={ characterStyle }
		>
			{ showSpeech && (
				<div className="dewey-speech-bubble">{ currentSpeech }</div>
			) }

			<div
				className={ `dewey-wrap dewey-state-${ safeState }` }
				style={ wrapStyle }
			>
				<div className="dewey-particles">
					{ particles.map( ( particle ) => (
						<Particle
							key={ particle.id }
							emoji={ particle.emoji }
							style={ particle.style }
						/>
					) ) }
				</div>

				<svg
					viewBox="0 0 170 190"
					xmlns="http://www.w3.org/2000/svg"
					style={ svgStyle }
					aria-label="Dewey, your archive research assistant"
					role="img"
				>
					<defs>
						<pattern
							id="dewey-cloth"
							patternUnits="userSpaceOnUse"
							width="4"
							height="4"
						>
							<line
								x1="0"
								y1="0"
								x2="4"
								y2="4"
								stroke="rgba(255,255,255,0.055)"
								strokeWidth="0.7"
							/>
							<line
								x1="4"
								y1="0"
								x2="0"
								y2="4"
								stroke="rgba(255,255,255,0.025)"
								strokeWidth="0.4"
							/>
						</pattern>
					</defs>

					<g id="dewey-group">
						<ellipse
							cx="85"
							cy="178"
							rx="44"
							ry="7.5"
							fill="rgba(0,0,0,0.32)"
						/>
						<rect
							x="55"
							y="152"
							width="20"
							height="14"
							rx="4.5"
							fill={ DEWEY_BASE_900 }
						/>
						<rect
							x="95"
							y="152"
							width="20"
							height="14"
							rx="4.5"
							fill={ DEWEY_BASE_900 }
						/>
						<ellipse
							cx="65"
							cy="166"
							rx="13"
							ry="6.5"
							fill={ DEWEY_BASE_850 }
						/>
						<ellipse
							cx="105"
							cy="166"
							rx="13"
							ry="6.5"
							fill={ DEWEY_BASE_850 }
						/>
						<rect
							x="59"
							y="161"
							width="11"
							height="5.5"
							rx="2"
							fill={ THEME_ACCENT }
						/>
						<rect
							x="99"
							y="161"
							width="11"
							height="5.5"
							rx="2"
							fill={ THEME_ACCENT }
						/>
						<rect
							x="62"
							y="162.5"
							width="5"
							height="2.5"
							rx="1"
							fill={ DEWEY_BASE_700 }
						/>
						<rect
							x="102"
							y="162.5"
							width="5"
							height="2.5"
							rx="1"
							fill={ DEWEY_BASE_700 }
						/>
						<path
							d="M46 100 Q28 107 25 125"
							stroke={ DEWEY_BASE_900 }
							strokeWidth="10"
							fill="none"
							strokeLinecap="round"
						/>
						<path
							d="M46 100 Q28 107 25 125"
							stroke={ DEWEY_BASE_700 }
							strokeWidth="7"
							fill="none"
							strokeLinecap="round"
						/>
						<circle
							cx="25"
							cy="127"
							r="8.5"
							fill={ DEWEY_BASE_700 }
						/>
						<circle
							cx="25"
							cy="127"
							r="8.5"
							fill="none"
							stroke={ DEWEY_BASE_900 }
							strokeWidth="1.5"
						/>
						<path
							d="M124 100 Q142 107 145 125"
							stroke={ DEWEY_BASE_900 }
							strokeWidth="10"
							fill="none"
							strokeLinecap="round"
						/>
						<path
							d="M124 100 Q142 107 145 125"
							stroke={ DEWEY_BASE_700 }
							strokeWidth="7"
							fill="none"
							strokeLinecap="round"
						/>
						<circle
							cx="145"
							cy="127"
							r="8.5"
							fill={ DEWEY_BASE_700 }
						/>
						<circle
							cx="145"
							cy="127"
							r="8.5"
							fill="none"
							stroke={ DEWEY_BASE_900 }
							strokeWidth="1.5"
						/>
						<rect
							x="38"
							y="46"
							width="17"
							height="114"
							rx="5"
							fill={ DEWEY_BASE_900 }
						/>
						<rect
							x="41"
							y="60"
							width="11"
							height="2.5"
							rx="1"
							fill={ THEME_ACCENT }
							opacity="0.65"
						/>
						<rect
							x="41"
							y="64"
							width="11"
							height="1"
							rx="0.5"
							fill={ THEME_ACCENT }
							opacity="0.4"
						/>
						<rect
							x="41"
							y="126"
							width="11"
							height="2.5"
							rx="1"
							fill={ THEME_ACCENT }
							opacity="0.65"
						/>
						<rect
							x="41"
							y="130"
							width="11"
							height="1"
							rx="0.5"
							fill={ THEME_ACCENT }
							opacity="0.4"
						/>
						<text
							x="46"
							y="98"
							textAnchor="middle"
							fontFamily="Georgia,serif"
							fontSize="7"
							fill={ THEME_ACCENT }
							opacity="0.8"
						>
							D
						</text>
						<rect
							x="50"
							y="42"
							width="82"
							height="118"
							rx="7"
							fill={ DEWEY_BASE_700 }
						/>
						<rect
							x="50"
							y="42"
							width="82"
							height="118"
							rx="7"
							fill="url(#dewey-cloth)"
						/>
						<rect
							x="55"
							y="47"
							width="72"
							height="108"
							rx="5"
							fill="none"
							stroke={ THEME_ACCENT }
							strokeWidth="1.6"
							opacity="0.55"
						/>
						<rect
							x="59"
							y="51"
							width="64"
							height="100"
							rx="4"
							fill="none"
							stroke={ THEME_ACCENT }
							strokeWidth="0.8"
							opacity="0.35"
						/>
						<rect
							x="52"
							y="42"
							width="5"
							height="118"
							rx="2"
							fill="rgba(0,0,0,0.2)"
						/>
						<rect
							x="129"
							y="42"
							width="3"
							height="118"
							rx="1"
							fill="rgba(255,255,255,0.07)"
						/>
						<rect
							x="55"
							y="62"
							width="36"
							height="80"
							rx="2"
							fill={ DEWEY_PAPER_100 }
						/>
						<rect
							x="55"
							y="62"
							width="5"
							height="80"
							fill="rgba(0,0,0,0.05)"
						/>
						{ PAGE_LINE_YS.map( ( y, i ) => (
							<line
								key={ i }
								x1="62"
								y1={ y }
								x2={ i % 3 === 2 ? 80 : 87 }
								y2={ y }
								stroke={ DEWEY_PAPER_LINE }
								strokeWidth="1"
							/>
						) ) }
						<g className="dewey-page-right">
							<rect
								x="91"
								y="62"
								width="36"
								height="80"
								rx="2"
								fill={ DEWEY_PAPER_200 }
							/>
							<rect
								x="122"
								y="62"
								width="5"
								height="80"
								fill="rgba(0,0,0,0.04)"
							/>
							{ PAGE_LINE_YS.map( ( y, i ) => (
								<line
									key={ i }
									x1="95"
									y1={ y }
									x2={ i % 3 === 2 ? 114 : 122 }
									y2={ y }
									stroke={ DEWEY_PAPER_LINE }
									strokeWidth="1"
								/>
							) ) }
						</g>
						<line
							x1="91"
							y1="62"
							x2="91"
							y2="142"
							stroke={ DEWEY_PAPER_SPINE }
							strokeWidth="1.5"
							opacity="0.6"
						/>
						<rect
							x="58"
							y="44"
							width="66"
							height="56"
							rx="13"
							fill={ DEWEY_BASE_600 }
						/>
						<rect
							x="58"
							y="44"
							width="66"
							height="28"
							rx="13"
							fill="rgba(255,255,255,0.05)"
						/>
						<ellipse
							cx="66"
							cy="87"
							rx="10"
							ry="7.5"
							fill={ DEWEY_BLUSH }
						/>
						<ellipse
							cx="104"
							cy="87"
							rx="10"
							ry="7.5"
							fill={ DEWEY_BLUSH }
						/>
						<ellipse
							cx="74"
							cy="71"
							rx="14"
							ry="14"
							fill={ DEWEY_PAPER_100 }
						/>
						<ellipse
							cx="96"
							cy="71"
							rx="14"
							ry="14"
							fill={ DEWEY_PAPER_100 }
						/>
						<g
							className="dewey-eye-l"
							style={ { transformOrigin: '74px 71px' } }
						>
							<g
								className="dewey-pupil-l"
								style={ { transformOrigin: '74px 71px' } }
							>
								<circle
									cx="74"
									cy="71"
									r="7.5"
									fill={ DEWEY_PUPIL_DARK }
								/>
								<circle
									cx="74"
									cy="71"
									r="5"
									fill={ DEWEY_PUPIL_LIGHT }
								/>
								<circle cx="77" cy="68" r="2.8" fill="white" />
								<circle
									cx="78"
									cy="69"
									r="1.1"
									fill="rgba(255,255,255,0.5)"
								/>
							</g>
							<ellipse
								cx="74"
								cy="59"
								rx="14"
								ry="3.5"
								fill={ DEWEY_BASE_600 }
							/>
						</g>
						<g
							className="dewey-eye-r"
							style={ { transformOrigin: '96px 71px' } }
						>
							<g
								className="dewey-pupil-r"
								style={ { transformOrigin: '96px 71px' } }
							>
								<circle
									cx="96"
									cy="71"
									r="7.5"
									fill={ DEWEY_PUPIL_DARK }
								/>
								<circle
									cx="96"
									cy="71"
									r="5"
									fill={ DEWEY_PUPIL_LIGHT }
								/>
								<circle cx="99" cy="68" r="2.8" fill="white" />
								<circle
									cx="100"
									cy="69"
									r="1.1"
									fill="rgba(255,255,255,0.5)"
								/>
							</g>
							<ellipse
								cx="96"
								cy="59"
								rx="14"
								ry="3.5"
								fill={ DEWEY_BASE_600 }
							/>
						</g>
						<ellipse
							cx="74"
							cy="71"
							rx="14"
							ry="14"
							fill="none"
							stroke={ THEME_ACCENT }
							strokeWidth="2.2"
						/>
						<ellipse
							cx="96"
							cy="71"
							rx="14"
							ry="14"
							fill="none"
							stroke={ THEME_ACCENT }
							strokeWidth="2.2"
						/>
						<path
							d="M65 90 Q85 101 105 90"
							stroke={ DEWEY_BASE_900 }
							strokeWidth="2.8"
							fill="none"
							strokeLinecap="round"
							opacity={ config.mouth === 'happy' ? 1 : 0 }
						/>
						<path
							d="M65 97 Q85 87 105 97"
							stroke={ DEWEY_BASE_900 }
							strokeWidth="2.8"
							fill="none"
							strokeLinecap="round"
							opacity={ config.mouth === 'sad' ? 1 : 0 }
						/>
						<ellipse
							cx="85"
							cy="93"
							rx="8"
							ry="6.5"
							fill={ DEWEY_BASE_900 }
							opacity={ config.mouth === 'shocked' ? 1 : 0 }
						/>
						<path
							d={ browPaths[ 0 ] }
							stroke={ THEME_ACCENT }
							strokeWidth="2.8"
							fill="none"
							strokeLinecap="round"
						/>
						<path
							d={ browPaths[ 1 ] }
							stroke={ THEME_ACCENT }
							strokeWidth="2.8"
							fill="none"
							strokeLinecap="round"
						/>
						<rect
							x="61"
							y="63"
							width="20"
							height="17"
							rx="6"
							fill="none"
							stroke={ THEME_ACCENT }
							strokeWidth="1.6"
							opacity="0.88"
						/>
						<rect
							x="85"
							y="63"
							width="20"
							height="17"
							rx="6"
							fill="none"
							stroke={ THEME_ACCENT }
							strokeWidth="1.6"
							opacity="0.88"
						/>
						<line
							x1="81"
							y1="71.5"
							x2="85"
							y2="71.5"
							stroke={ THEME_ACCENT }
							strokeWidth="1.6"
							opacity="0.88"
						/>
						<line
							x1="61"
							y1="71.5"
							x2="55"
							y2="69"
							stroke={ THEME_ACCENT }
							strokeWidth="1.6"
							opacity="0.88"
						/>
						<line
							x1="105"
							y1="71.5"
							x2="111"
							y2="69"
							stroke={ THEME_ACCENT }
							strokeWidth="1.6"
							opacity="0.88"
						/>
						<rect
							x="117"
							y="42"
							width="10"
							height="36"
							fill={ THEME_ACCENT_DARK }
						/>
						<polygon
							points="117,78 127,78 122,88"
							fill={ THEME_ACCENT_DARK }
						/>
						<rect
							x="117"
							y="42"
							width="10"
							height="5.5"
							rx="1.5"
							fill={ THEME_ACCENT }
						/>
						<text
							x="85"
							y="111"
							textAnchor="middle"
							fontFamily="Georgia,serif"
							fontSize="8"
							fontWeight="900"
							fill={ THEME_ACCENT }
							letterSpacing="1.8"
							opacity="0.95"
						>
							DEWEY
						</text>
						<text
							x="85"
							y="122"
							textAnchor="middle"
							fontFamily="Georgia,serif"
							fontSize="6"
							fill={ THEME_ACCENT }
							letterSpacing="0.8"
							opacity="0.65"
						>
							Vol. I
						</text>
						<line
							x1="70"
							y1="126"
							x2="100"
							y2="126"
							stroke={ THEME_ACCENT }
							strokeWidth="0.8"
							opacity="0.5"
						/>
						<circle
							cx="85"
							cy="126"
							r="1.8"
							fill={ THEME_ACCENT }
							opacity="0.5"
						/>
						<path
							d="M57 144 L57 152 L65 152"
							stroke={ THEME_ACCENT }
							strokeWidth="1.2"
							fill="none"
							opacity="0.4"
						/>
						<path
							d="M127 144 L127 152 L119 152"
							stroke={ THEME_ACCENT }
							strokeWidth="1.2"
							fill="none"
							opacity="0.4"
						/>
					</g>
				</svg>
			</div>
		</div>
	);
}

export default memo( Dewey );
