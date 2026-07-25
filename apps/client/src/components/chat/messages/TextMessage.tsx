import { MdDone, MdDoneAll } from 'react-icons/md';
import { twMerge } from 'tailwind-merge';

import type { TextMessage as TextMessageType } from '../types';

interface TextMessageProps {
	message: TextMessageType;
}

export const ChatTextMessage: React.FC<TextMessageProps> = props => {
	const isSent = props.message.direction === 'sent';

	return (
		<article
			className={twMerge(
				'max-w-[84%] rounded-xl px-3 py-2.5 shadow-sm mobile:max-w-[72%]',
				isSent
					? 'self-end rounded-tr bg-[#d9fdd3] dark:bg-[#0d5231]'
					: 'self-start rounded-tl bg-white dark:bg-[#18242b]'
			)}>
			<p className="text-[13px]">{props.message.text}</p>
			<time className="mt-1 flex items-center justify-end gap-0.5 text-[9px] text-slate-400">
				{props.message.time}
				{props.message.status === 'sent' && <MdDone className="text-sky-500" aria-label="Enviada" />}
				{props.message.status === 'read' && <MdDoneAll className="text-sky-500" aria-label="Lida" />}
			</time>
		</article>
	);
};
