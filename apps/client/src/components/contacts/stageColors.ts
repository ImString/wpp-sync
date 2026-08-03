export const hexToRgba = (hex: string, alpha: number) => {
	const normalized = hex.replace('#', '');
	const fullHex =
		normalized.length === 3
			? normalized
					.split('')
					.map(character => character + character)
					.join('')
			: normalized;
	const value = Number.parseInt(fullHex, 16);

	if (Number.isNaN(value)) return `rgba(148, 163, 184, ${alpha})`;

	return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
};

export const stageColorPresets = [
	'#25d366',
	'#0ea5e9',
	'#6366f1',
	'#8b5cf6',
	'#d946ef',
	'#f43f5e',
	'#f97316',
	'#f59e0b',
	'#14b8a6',
	'#64748b'
];
