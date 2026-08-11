import { twMerge } from 'tailwind-merge';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@/components/buttons';

import { useChatStore } from '../store';
import type { ConversationFilter } from '../types';

const filters: Array<{ id: ConversationFilter; label: string }> = [
	{ id: 'all', label: 'Todas' },
	{ id: 'unread', label: 'Não lidas' },
	{ id: 'waiting', label: 'Aguardando' },
	{ id: 'groups', label: 'Grupos' }
];

export const ConversationFilters: React.FC = () => {
	const { activeFilter, conversations, setActiveFilter } = useChatStore(
		useShallow(state => ({
			activeFilter: state.activeFilter,
			conversations: state.conversations,
			setActiveFilter: state.setActiveFilter
		}))
	);

	return (
		<div
			className="scrollbar-none flex shrink-0 gap-1.5 overflow-x-auto px-3.5 pb-3 pt-3.5"
			role="tablist"
			aria-label="Filtros de conversas">
			{filters.map(filter => (
				<Button
					key={filter.id}
					theme="unstyled"
					type="button"
					role="tab"
					aria-selected={activeFilter === filter.id}
					className={twMerge('filter', activeFilter === filter.id ? 'filter-active' : 'filter-idle')}
					onClick={() => setActiveFilter(filter.id)}>
					{filter.label}
					{filter.id === 'unread' && conversations.some(conversation => conversation.type === 'unread') && (
						<span className="grid size-4.5 place-items-center rounded-full bg-brand-500 text-[9px] font-bold text-white">
							{conversations.filter(conversation => conversation.type === 'unread').length}
						</span>
					)}
				</Button>
			))}
		</div>
	);
};
