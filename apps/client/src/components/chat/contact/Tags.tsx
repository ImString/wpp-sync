import { MdAdd } from 'react-icons/md';

import { Button } from '@/components/buttons';

import { conversations } from '../data';
import { useChatStore } from '../store';

export const ContactTags: React.FC = () => {
	const selectedConversationId = useChatStore(state => state.selectedConversationId);
	const conversation = conversations.find(item => item.id === selectedConversationId) || conversations[0];

	return (
		<section className="border-b border-slate-200 p-4.5 dark:border-[#223138]">
			<div className="flex items-center justify-between">
				<h3 className="text-xs font-semibold">Tags</h3>
				<Button
					theme="ghost"
					type="button"
					aria-label="Adicionar tag"
					className="size-7 min-h-7 rounded-full p-0 text-lg">
					<MdAdd aria-hidden="true" />
				</Button>
			</div>
			<div className="mt-3 flex flex-wrap gap-1.5">
				{conversation.tags.map(tag => (
					<span
						key={tag}
						className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-semibold text-brand-700 dark:bg-[#0f3826] dark:text-brand-400">
						{tag}
					</span>
				))}
			</div>
		</section>
	);
};
