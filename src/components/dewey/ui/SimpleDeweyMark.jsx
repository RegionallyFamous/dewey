/**
 * SimpleDeweyMark.jsx
 *
 * Lightweight static Dewey mark for mobile FAB usage.
 */

const DEWEY_BASE_900 = 'var(--dewey-base-900, #1b4332)';
const DEWEY_BASE_700 = 'var(--dewey-base-700, #2d6a4f)';
const DEWEY_BASE_600 = 'var(--dewey-base-600, #3d8a6a)';
const DEWEY_PAPER_100 = 'var(--dewey-paper-100, #fdf6e3)';
const DEWEY_PAPER_200 = 'var(--dewey-paper-200, #f5edd6)';
const DEWEY_PAPER_LINE = 'var(--dewey-paper-line, #c4b898)';
const DEWEY_RIBBON = 'var(--dewey-ribbon, #8b1e2e)';

export default function SimpleDeweyMark() {
	return (
		<svg
			className="dewey-fab__mini-svg"
			viewBox="0 0 64 64"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
			focusable="false"
		>
			<defs>
				<linearGradient
					id="dewey-mini-cover"
					x1="0"
					y1="0"
					x2="1"
					y2="1"
				>
					<stop offset="0%" stopColor={ DEWEY_BASE_700 } />
					<stop offset="100%" stopColor={ DEWEY_BASE_900 } />
				</linearGradient>
			</defs>
			<circle cx="32" cy="32" r="30" fill="#ffffff" stroke="#dcdcde" />
			<rect
				x="16"
				y="12"
				width="32"
				height="40"
				rx="7"
				fill="url(#dewey-mini-cover)"
			/>
			<rect
				x="21"
				y="18"
				width="22"
				height="16"
				rx="5"
				fill={ DEWEY_BASE_600 }
			/>
			<circle cx="28" cy="26" r="4.6" fill={ DEWEY_PAPER_100 } />
			<circle cx="36" cy="26" r="4.6" fill={ DEWEY_PAPER_100 } />
			<circle cx="28" cy="26" r="2.2" fill={ DEWEY_BASE_900 } />
			<circle cx="36" cy="26" r="2.2" fill={ DEWEY_BASE_900 } />
			<path
				d="M25 33 C28 36 36 36 39 33"
				stroke={ DEWEY_PAPER_100 }
				strokeWidth="2.2"
				fill="none"
				strokeLinecap="round"
			/>
			<rect
				x="19"
				y="37"
				width="26"
				height="10"
				rx="2"
				fill={ DEWEY_PAPER_200 }
			/>
			<line
				x1="32"
				y1="37"
				x2="32"
				y2="47"
				stroke={ DEWEY_PAPER_LINE }
				strokeWidth="1.2"
			/>
			<rect
				x="44"
				y="12"
				width="4"
				height="16"
				rx="1.2"
				fill={ DEWEY_RIBBON }
			/>
		</svg>
	);
}
