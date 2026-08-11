import { useEffect, useState } from 'react';
import { MdAudiotrack, MdDownload, MdInsertDriveFile, MdVideocam } from 'react-icons/md';
import { twMerge } from 'tailwind-merge';

import type { FileMessage as FileMessageType } from '../types';
import { MessageStatus } from './Status';

interface FileMessageProps {
	message: FileMessageType;
	onRetry?: (requestId: string) => void;
	onMediaLoad?: () => void;
}

const FileIcon: React.FC<{ kind?: FileMessageType['fileKind'] }> = ({ kind }) => {
	if (kind === 'audio') return <MdAudiotrack className="size-5" aria-hidden="true" />;
	if (kind === 'video') return <MdVideocam className="size-5" aria-hidden="true" />;
	return <MdInsertDriveFile className="size-5" aria-hidden="true" />;
};

const getFileExtension = (name: string) => name.split('.').at(-1)?.slice(0, 4).toUpperCase() || 'FILE';

export const ChatFileMessage: React.FC<FileMessageProps> = props => {
	const isSent = props.message.direction === 'sent';
	const [imageSource, setImageSource] = useState(props.message.previewUrl || props.message.url);

	useEffect(() => {
		const previewUrl = props.message.previewUrl;
		const remoteUrl = props.message.url;

		if (!remoteUrl) {
			setImageSource(previewUrl);
			return;
		}

		if (!previewUrl) {
			setImageSource(remoteUrl);
			return;
		}

		let active = true;
		const remoteImage = new Image();
		remoteImage.onload = () => {
			if (!active) return;
			setImageSource(remoteUrl);
		};
		remoteImage.src = remoteUrl;

		return () => {
			active = false;
		};
	}, [props.message.previewUrl, props.message.url]);

	return (
		<article
			className={twMerge(
				'min-w-[min(270px,82vw)] max-w-[84%] rounded-xl p-2.5 shadow-sm mobile:max-w-[72%]',
				isSent
					? 'self-end rounded-tr bg-[#d9fdd3] dark:bg-[#0d5231]'
					: 'self-start rounded-tl bg-white dark:bg-[#18242b]',
				props.message.status === 'error' && 'ring-1 ring-red-500/60'
			)}>
			{props.message.fileKind === 'image' && imageSource && (
				<img
					src={imageSource}
					alt={props.message.name}
					onLoad={props.onMediaLoad}
					className="mb-2 max-h-72 w-full rounded-lg object-cover"
				/>
			)}

			<div className="grid grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-2.5">
				<span
					className={twMerge(
						'grid size-10.5 place-items-center rounded-lg text-white',
						props.message.fileKind === 'image'
							? 'bg-violet-500'
							: props.message.fileKind === 'audio'
								? 'bg-emerald-500'
								: props.message.fileKind === 'video'
									? 'bg-sky-500'
									: 'bg-red-500'
					)}>
					{props.message.fileKind === 'file' || !props.message.fileKind ? (
						<small className="max-w-9 truncate px-1 text-[8px] font-bold">
							{getFileExtension(props.message.name)}
						</small>
					) : (
						<FileIcon kind={props.message.fileKind} />
					)}
				</span>
				<span className="flex min-w-0 flex-col">
					<strong className="truncate text-xs">{props.message.name}</strong>
					<small className="mt-0.5 truncate text-[10px] text-slate-500 dark:text-slate-400">
						{props.message.details}
					</small>
				</span>
				{props.message.url && props.message.status !== 'sending' ? (
					<a
						href={props.message.url}
						target="_blank"
						rel="noreferrer"
						aria-label={`Abrir ${props.message.name}`}
						className="grid size-8 place-items-center rounded-full text-slate-500 transition hover:bg-black/5 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white">
						<MdDownload className="size-4" aria-hidden="true" />
					</a>
				) : (
					<span />
				)}
			</div>

			{props.message.caption && <p className="mt-2 text-[13px]">{props.message.caption}</p>}
			<time className="mt-1 flex items-center justify-end gap-0.5 whitespace-nowrap text-[9px] text-slate-400">
				{props.message.time}
				<MessageStatus {...props.message} onRetry={props.onRetry} />
			</time>
		</article>
	);
};
