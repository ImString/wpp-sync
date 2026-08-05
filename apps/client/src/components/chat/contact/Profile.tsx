import { twMerge } from 'tailwind-merge';

import { Image } from '@/components/shared/Image';

import { useChatStore } from '../store';

export const ContactProfile: React.FC = () => {
	const conversations = useChatStore(state => state.conversations);
	const selectedConversationId = useChatStore(state => state.selectedConversationId);
	const conversation = conversations.find(item => item.id === selectedConversationId) || conversations[0];

	return (
		<section className="flex items-center gap-3 border-b border-slate-200 px-4.5 py-5 dark:border-[#223138]">
			<Image
				className={twMerge(
					'inline-grid size-16 w-10 h-10 flex-0 place-items-center rounded-full',
					conversation.avatarClassName
				)}
				seed={conversation.initials}
				collection="initials"
			/>
			<div className="flex min-w-0 flex-col">
				<strong className="truncate text-[15px]">{conversation.name}</strong>
				<span className="mt-1 truncate text-[11px] text-slate-500 dark:text-slate-400">
					{conversation.phone}
				</span>
			</div>
		</section>
	);
};
