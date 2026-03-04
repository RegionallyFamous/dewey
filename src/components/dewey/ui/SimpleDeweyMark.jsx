/**
 * SimpleDeweyMark.jsx
 *
 * Lightweight static Dewey mark for mobile FAB usage.
 */

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
					<stop offset="0%" stopColor="#2d6a4f" />
					<stop offset="100%" stopColor="#1b4332" />
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
			<rect x="21" y="18" width="22" height="16" rx="5" fill="#3d8a6a" />
			<circle cx="28" cy="26" r="4.6" fill="#fdf6e3" />
			<circle cx="36" cy="26" r="4.6" fill="#fdf6e3" />
			<circle cx="28" cy="26" r="2.2" fill="#1b4332" />
			<circle cx="36" cy="26" r="2.2" fill="#1b4332" />
			<path
				d="M25 33 C28 36 36 36 39 33"
				stroke="#fdf6e3"
				strokeWidth="2.2"
				fill="none"
				strokeLinecap="round"
			/>
			<rect x="19" y="37" width="26" height="10" rx="2" fill="#f5edd6" />
			<line
				x1="32"
				y1="37"
				x2="32"
				y2="47"
				stroke="#c4b898"
				strokeWidth="1.2"
			/>
			<rect x="44" y="12" width="4" height="16" rx="1.2" fill="#8b1e2e" />
		</svg>
	);
}
