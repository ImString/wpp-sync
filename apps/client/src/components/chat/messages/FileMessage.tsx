import type { FileMessage as FileMessageType } from '../types';

interface FileMessageProps {
	message: FileMessageType;
}

export const ChatFileMessage: React.FC<FileMessageProps> = props => {
	return (
		<article className="grid min-w-[min(270px,82vw)] max-w-[84%] grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-2.5 self-start rounded-xl rounded-tl bg-white p-2.5 shadow-sm dark:bg-[#18242b] mobile:max-w-[72%]">
			<span className="grid h-11 w-9.5 place-items-center rounded-lg bg-red-500 text-[9px] font-bold text-white">
				PDF
			</span>
			<span className="flex min-w-0 flex-col">
				<strong className="truncate text-xs">{props.message.name}</strong>
				<small className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">{props.message.details}</small>
			</span>
			<time className="self-end whitespace-nowrap text-[9px] text-slate-400">{props.message.time}</time>
		</article>
	);
};
