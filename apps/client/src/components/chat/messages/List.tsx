import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useChatStore } from '../store';
import { ChatFileMessage } from './FileMessage';
import { ChatTextMessage } from './TextMessage';

export const MessageList: React.FC = () => {
	const { selectedConversationId, messagesByConversation } = useChatStore(
		useShallow(state => ({
			selectedConversationId: state.selectedConversationId,
			messagesByConversation: state.messages
		}))
	);
	const messages = messagesByConversation[selectedConversationId] || [];
	const listRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
	}, [messages, selectedConversationId]);

	return (
		<div
			ref={listRef}
			aria-live="polite"
			className="chat-pattern flex min-h-0 flex-col gap-3.5 overflow-y-auto px-3 py-5 mobile:px-7 mobile:py-6 scrollbar-thin">
			<div className="flex justify-center">
				<span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-[10px] text-slate-500 shadow-panel dark:border-[#223138] dark:bg-[#0e181e]/90 dark:text-slate-400">
					Hoje
				</span>
			</div>

			{messages.map(message =>
				message.type === 'file' ? (
					<ChatFileMessage key={message.id} message={message} />
				) : (
					<ChatTextMessage key={message.id} message={message} />
				)
			)}
		</div>
	);
};
