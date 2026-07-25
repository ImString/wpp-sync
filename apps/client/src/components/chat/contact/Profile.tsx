import { twMerge } from 'tailwind-merge';

import { conversations } from '../data';
import { useChatStore } from '../store';

export const ContactProfile: React.FC = () => {
	const selectedConversationId = useChatStore(state => state.selectedConversationId);
	const conversation = conversations.find(item => item.id === selectedConversationId) || conversations[0];

	return (
		<section className="flex items-center gap-3 border-b border-slate-200 px-4.5 py-5 dark:border-[#223138]">
			<span className={twMerge('avatar size-16 bg-linear-to-br text-[17px]', conversation.avatarClassName)}>
				{conversation.initials}
			</span>
			<div className="flex min-w-0 flex-col">
				<strong className="truncate text-[15px]">{conversation.name}</strong>
				<span className="mt-1 truncate text-[11px] text-slate-500 dark:text-slate-400">
					{conversation.phone}
				</span>
			</div>
		</section>
	);
};
