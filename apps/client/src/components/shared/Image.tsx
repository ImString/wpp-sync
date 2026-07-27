import { useMemo } from 'react';

export type ImageStyle =
	| 'adventurer'
	| 'adventurer-neutral'
	| 'avataaars'
	| 'avataaars-neutral'
	| 'big-ears'
	| 'big-ears-neutral'
	| 'big-smile'
	| 'bottts'
	| 'bottts-neutral'
	| 'croodles'
	| 'croodles-neutral'
	| 'fun-emoji'
	| 'icons'
	| 'identicon'
	| 'initials'
	| 'lorelei'
	| 'lorelei-neutral'
	| 'initials'
	| 'micah'
	| 'miniavs'
	| 'notionists'
	| 'notionists-neutral'
	| 'open-peeps'
	| 'personas'
	| 'pixel-art'
	| 'pixel-art-neutral'
	| 'rings'
	| 'shapes'
	| 'thumbs';

export type ImageProps = {
	src?: string;
	seed?: string;
	collection?: ImageStyle;
	scale?: number;
	size?: number;
	type?: 'svg' | 'png' | 'jpg';
	backgroundType?: 'gradientLinear' | 'solid';
	query?: Record<string, string>;
} & React.HTMLAttributes<HTMLImageElement>;

export const Image: React.FC<ImageProps> = ({
	src,
	seed,
	collection,
	type,
	scale,
	size,
	backgroundType,
	query,
	...props
}) => {
	seed = seed || Math.random().toString();
	collection = collection || 'thumbs';
	type = type || 'png';

	const imageURL = useMemo(() => {
		const params = new URLSearchParams({
			seed,
			scale: `${scale || 100}`,
			size: `${size || 100}`,
			backgroundType: backgroundType || 'solid',
			...query
		});

		return src || `https://api.dicebear.com/9.x/${collection}/${type}?${params}`;
	}, [src, seed, collection]);

	return <img src={imageURL} {...props} />;
};
