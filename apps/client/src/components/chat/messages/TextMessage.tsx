import { twMerge } from 'tailwind-merge';

import type { TextMessage as TextMessageType } from '../types';
import { MessageStatus } from './Status';

interface TextMessageProps {
	message: TextMessageType;
	onRetry?: (requestId: string) => void;
}

export const ChatTextMessage: React.FC<TextMessageProps> = props => {
	const isSent = props.message.direction === 'sent';

	return (
		<article
			className={twMerge(
				'max-w-[84%] rounded-xl px-3 py-2.5 shadow-sm mobile:max-w-[72%]',
				isSent
					? 'self-end rounded-tr bg-[#d9fdd3] dark:bg-[#0d5231]'
					: 'self-start rounded-tl bg-white dark:bg-[#18242b]',
				props.message.status === 'error' && 'ring-1 ring-red-500/60'
			)}>
			<p className="text-[13px]">{props.message.text}</p>
			<time className="mt-1 flex items-center justify-end gap-0.5 text-[9px] text-slate-400">
				{props.message.time}
				<MessageStatus {...props.message} onRetry={props.onRetry} />
			</time>
		</article>
	);
};
