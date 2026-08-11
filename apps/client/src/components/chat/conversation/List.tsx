import { useRef } from 'react';

import { Button } from '@/components/buttons';
import { useInfiniteScroll } from '@/components/infiniteScroll';

import type { Conversation } from '../types';
import { ConversationItem } from './Item';

interface ConversationListProps {
	conversations: Conversation[];
	error?: string;
	hasMore: boolean;
	isLoading: boolean;
	onLoadMore: () => void | Promise<void>;
}

export const ConversationListSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
	<div className="animate-pulse motion-reduce:animate-none" role="status" aria-label="Carregando conversas">
		{Array.from({ length: count }, (_, index) => (
			<div key={index} aria-hidden="true" className="flex min-h-18 items-center gap-3 rounded-xl px-2.5 py-2.5">
				<span className="relative shrink-0">
					<span className="block size-10 rounded-full bg-slate-200 dark:bg-[#1b2a31]" />
					<span className="absolute -left-1 -top-1 block size-4.5 rounded-full bg-slate-100 ring-2 ring-white dark:bg-[#17262e] dark:ring-[#0e181e]" />
				</span>
				<span className="min-w-0 flex-1 space-y-2.5">
					<span className="flex items-center justify-between gap-4">
						<span className="block h-2.5 w-28 rounded-full bg-slate-200 dark:bg-[#1b2a31]" />
						<span className="block h-2 w-9 rounded-full bg-slate-100 dark:bg-[#17262e]" />
					</span>
					<span className="block h-2 w-4/5 rounded-full bg-slate-100 dark:bg-[#17262e]" />
				</span>
			</div>
		))}
	</div>
);

export const ConversationList: React.FC<ConversationListProps> = props => {
	const listRef = useRef<HTMLDivElement>(null);
	const { sentinelRef } = useInfiniteScroll({
		rootRef: listRef,
		hasMore: props.hasMore,
		isLoading: props.isLoading,
		onLoadMore: props.onLoadMore
	});

	return (
		<div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-2 pb-4 scrollbar-thin">
			{props.conversations.map(conversation => (
				<ConversationItem key={conversation.id} conversation={conversation} />
			))}

			<div ref={sentinelRef} className="min-h-1 w-full" aria-live="polite">
				{props.isLoading && <ConversationListSkeleton count={2} />}
				{props.error && !props.isLoading && (
					<div className="flex flex-col items-center gap-2 px-3 py-2 text-center">
						<small className="text-[11px] text-red-600 dark:text-red-400">{props.error}</small>
						<Button theme="ghost" type="button" className="min-h-8 px-3 text-xs" onClick={props.onLoadMore}>
							Tentar novamente
						</Button>
					</div>
				)}
			</div>
		</div>
	);
};
