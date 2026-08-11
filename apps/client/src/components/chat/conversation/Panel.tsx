import { useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@/components/buttons';

import { useChatStore } from '../store';
import { ConversationEmpty } from './Empty';
import { ConversationFilters } from './Filters';
import { ConversationHeader } from './Header';
import { ConversationList, ConversationListSkeleton } from './List';
import { ConversationSearch } from './Search';

const normalizeText = (value: string) => {
	return value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim();
};

export const ConversationPanel: React.FC = () => {
	const { uid } = useParams<{ uid: string }>();
	const {
		activeFilter,
		conversations,
		conversationsError,
		conversationsHasMore,
		conversationsIsLoadingMore,
		conversationsStatus,
		initializeConversations,
		loadMoreConversations,
		search
	} = useChatStore(
		useShallow(state => ({
			activeFilter: state.activeFilter,
			conversations: state.conversations,
			conversationsError: state.conversationsError,
			conversationsHasMore: state.conversationsHasMore,
			conversationsIsLoadingMore: state.conversationsIsLoadingMore,
			conversationsStatus: state.conversationsStatus,
			initializeConversations: state.initializeConversations,
			loadMoreConversations: state.loadMoreConversations,
			search: state.search
		}))
	);
	const loadMore = useCallback(() => {
		if (uid) return loadMoreConversations(uid);
	}, [loadMoreConversations, uid]);

	const filteredConversations = useMemo(() => {
		const normalizedSearch = normalizeText(search);

		return conversations.filter(conversation => {
			const matchesSearch = normalizeText(conversation.name).includes(normalizedSearch);
			const matchesFilter = activeFilter === 'all' || conversation.type === activeFilter;

			return matchesSearch && matchesFilter;
		});
	}, [activeFilter, conversations, search]);

	return (
		<section className="conversation-panel mobile-screen flex min-h-0 flex-col overflow-hidden border-r border-slate-200 bg-white dark:border-[#223138] dark:bg-[#0e181e]">
			<ConversationHeader />
			<ConversationSearch />
			<ConversationFilters />
			{conversationsStatus === 'loading' && conversations.length === 0 ? (
				<div className="min-h-0 flex-1 overflow-hidden px-2 pb-4">
					<ConversationListSkeleton count={7} />
				</div>
			) : conversationsStatus === 'error' && conversations.length === 0 ? (
				<div className="grid min-h-0 flex-1 place-content-center justify-items-center gap-3 px-5 text-center">
					<p className="text-xs text-red-600 dark:text-red-400">{conversationsError}</p>
					<Button
						theme="ghost"
						type="button"
						className="min-h-9 px-3 text-xs"
						onClick={() => uid && void initializeConversations(uid, true)}>
						Tentar novamente
					</Button>
				</div>
			) : filteredConversations.length || conversationsHasMore ? (
				<ConversationList
					conversations={filteredConversations}
					error={conversationsIsLoadingMore ? undefined : conversationsError}
					hasMore={conversationsHasMore}
					isLoading={conversationsIsLoadingMore}
					onLoadMore={loadMore}
				/>
			) : (
				<ConversationEmpty />
			)}
		</section>
	);
};
