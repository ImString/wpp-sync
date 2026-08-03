import { useMemo } from 'react';

interface QrCodeProps {
	seed: number;
	className?: string;
}

const size = 33;
const finderOrigins = [
	[0, 0],
	[size - 7, 0],
	[0, size - 7]
];

const inFinder = (x: number, y: number) =>
	finderOrigins.some(([originX, originY]) => x >= originX && x < originX + 7 && y >= originY && y < originY + 7);

const finderValue = (x: number, y: number) => {
	const origin = finderOrigins.find(
		([originX, originY]) => x >= originX && x < originX + 7 && y >= originY && y < originY + 7
	);
	if (!origin) return false;
	const localX = x - origin[0];
	const localY = y - origin[1];
	return (
		localX === 0 ||
		localX === 6 ||
		localY === 0 ||
		localY === 6 ||
		(localX >= 2 && localX <= 4 && localY >= 2 && localY <= 4)
	);
};

export const QrCode: React.FC<QrCodeProps> = props => {
	const modules = useMemo(() => {
		const filled: Array<[number, number]> = [];

		for (let y = 0; y < size; y += 1) {
			for (let x = 0; x < size; x += 1) {
				if (inFinder(x, y)) {
					if (finderValue(x, y)) filled.push([x, y]);
					continue;
				}

				const timingPattern = (x === 6 || y === 6) && (x + y) % 2 === 0;
				const value = ((x * 29 + y * 43 + props.seed * 17 + ((x * y) % 31)) ^ (x + y + props.seed)) % 7;
				if (timingPattern || value < 3) filled.push([x, y]);
			}
		}

		return filled;
	}, [props.seed]);

	return (
		<svg
			viewBox={`0 0 ${size + 8} ${size + 8}`}
			role="img"
			aria-label="QR Code para conectar o WhatsApp"
			className={props.className}
			shapeRendering="crispEdges">
			<rect width={size + 8} height={size + 8} rx="2" fill="white" />
			{modules.map(([x, y]) => (
				<rect key={`${x}-${y}`} x={x + 4} y={y + 4} width="1" height="1" fill="#07120d" />
			))}
		</svg>
	);
};
