import { twMerge } from 'tailwind-merge';

import { Button } from '@/components/buttons';

import { useChatStore } from '../store';
import type { ConversationFilter } from '../types';

const filters: Array<{ id: ConversationFilter; label: string; count?: number }> = [
	{ id: 'all', label: 'Todas' },
	{ id: 'unread', label: 'Não lidas', count: 8 },
	{ id: 'waiting', label: 'Aguardando' },
	{ id: 'groups', label: 'Grupos' }
];

export const ConversationFilters: React.FC = () => {
	const activeFilter = useChatStore(state => state.activeFilter);
	const setActiveFilter = useChatStore(state => state.setActiveFilter);

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
					{filter.count && (
						<span className="grid size-4.5 place-items-center rounded-full bg-brand-500 text-[9px] font-bold text-white">
							{filter.count}
						</span>
					)}
				</Button>
			))}
		</div>
	);
};
