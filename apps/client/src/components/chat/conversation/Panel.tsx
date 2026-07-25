import { useMemo } from 'react';

import { conversations } from '../data';
import { useChatStore } from '../store';
import { ConversationEmpty } from './Empty';
import { ConversationFilters } from './Filters';
import { ConversationHeader } from './Header';
import { ConversationList } from './List';
import { ConversationSearch } from './Search';

const normalizeText = (value: string) => {
	return value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim();
};

export const ConversationPanel: React.FC = () => {
	const activeFilter = useChatStore(state => state.activeFilter);
	const search = useChatStore(state => state.search);

	const filteredConversations = useMemo(() => {
		const normalizedSearch = normalizeText(search);

		return conversations.filter(conversation => {
			const matchesSearch = normalizeText(conversation.name).includes(normalizedSearch);
			const matchesFilter = activeFilter === 'all' || conversation.type === activeFilter;

			return matchesSearch && matchesFilter;
		});
	}, [activeFilter, search]);

	return (
		<section className="conversation-panel mobile-screen flex min-h-0 flex-col overflow-hidden border-r border-slate-200 bg-white dark:border-[#223138] dark:bg-[#0e181e]">
			<ConversationHeader />
			<ConversationSearch />
			<ConversationFilters />
			{filteredConversations.length ? (
				<ConversationList conversations={filteredConversations} />
			) : (
				<ConversationEmpty />
			)}
		</section>
	);
};
