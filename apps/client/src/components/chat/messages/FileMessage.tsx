import { twMerge } from 'tailwind-merge';

import type { FileMessage as FileMessageType } from '../types';

interface FileMessageProps {
	message: FileMessageType;
}

export const ChatFileMessage: React.FC<FileMessageProps> = props => {
	const isSent = props.message.direction === 'sent';

	return (
		<article
			className={twMerge(
				'grid min-w-[min(270px,82vw)] max-w-[84%] grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-2.5 rounded-xl p-2.5 shadow-sm mobile:max-w-[72%]',
				isSent
					? 'self-end rounded-tr bg-[#d9fdd3] dark:bg-[#0d5231]'
					: 'self-start rounded-tl bg-white dark:bg-[#18242b]'
			)}>
			<span className="grid h-11 w-9.5 place-items-center rounded-lg bg-red-500 text-[9px] font-bold text-white">
				PDF
			</span>
			<span className="flex min-w-0 flex-col">
				<strong className="truncate text-xs">{props.message.name}</strong>
				<small className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{props.message.details}</small>
			</span>
			<time className="self-end whitespace-nowrap text-[9px] text-slate-400">{props.message.time}</time>
		</article>
	);
};
