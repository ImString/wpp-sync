import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@/components/buttons';
import { useInfiniteScroll } from '@/components/infiniteScroll';

import { useChatStore } from '../store';
import type { ChatMessage } from '../types';
import { ChatFileMessage } from './FileMessage';
import { ChatTextMessage } from './TextMessage';

interface ForceMessageScrollRequest {
	requestId: string;
	token: number;
}

interface MessageListProps {
	messages: ChatMessage[];
	onRetry: (requestId: string) => void;
	forceScrollRequest?: ForceMessageScrollRequest;
}

const messageScrollPositions = new Map<string, number>();

export const MessageListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
	<div
		className="flex w-full shrink-0 animate-pulse flex-col gap-3 motion-reduce:animate-none"
		role="status"
		aria-label="Carregando mensagens">
		{Array.from({ length: count }, (_, index) => {
			const isSent = index % 3 === 1;
			const width = index % 3 === 0 ? 'w-[62%]' : index % 3 === 1 ? 'w-[54%]' : 'w-[45%]';

			return (
				<div
					key={index}
					aria-hidden="true"
					className={`${width} ${isSent ? 'self-end rounded-tr' : 'self-start rounded-tl'} space-y-2 rounded-xl bg-slate-200/90 px-3 py-3 dark:bg-[#1b2a31]`}>
					<span className="block h-2.5 w-full rounded-full bg-slate-300/80 dark:bg-[#263841]" />
					<span className="block h-2.5 w-3/5 rounded-full bg-slate-300/60 dark:bg-[#223138]" />
					<span className="ml-auto block h-1.5 w-8 rounded-full bg-slate-300/70 dark:bg-[#263841]" />
				</div>
			);
		})}
	</div>
);

export const MessageList: React.FC<MessageListProps> = ({ messages, onRetry, forceScrollRequest }) => {
	const { uid } = useParams<{ uid: string }>();
	const { loadOlderMessages, messagesPagination, selectedConversationId } = useChatStore(
		useShallow(state => ({
			loadOlderMessages: state.loadOlderMessages,
			messagesPagination: state.messagesPagination,
			selectedConversationId: state.selectedConversationId
		}))
	);
	const pagination = messagesPagination[selectedConversationId];
	const listRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const initializedScrollRef = useRef(false);
	const restoredFromMemoryRef = useRef(false);
	const userInteractedWithScrollRef = useRef(false);
	const lastAppliedForceScrollRef = useRef<number | undefined>(undefined);
	const previousMessageCountRef = useRef(0);
	const nearBottomRef = useRef(true);
	const scrollMemoryKey = `${uid || ''}:${selectedConversationId}`;
	const pendingScrollRef = useRef<
		| {
				conversationId: string;
				scrollHeight: number;
				scrollTop: number;
		  }
		| undefined
	>(undefined);

	const loadOlder = useCallback(async () => {
		const area = listRef.current;
		if (!uid || !area || !selectedConversationId) return;

		pendingScrollRef.current = {
			conversationId: selectedConversationId,
			scrollHeight: area.scrollHeight,
			scrollTop: area.scrollTop
		};

		const addedCount = await loadOlderMessages(uid, selectedConversationId);
		if (addedCount === 0) pendingScrollRef.current = undefined;
	}, [loadOlderMessages, selectedConversationId, uid]);

	const { sentinelRef } = useInfiniteScroll({
		rootRef: listRef,
		hasMore: pagination?.hasMore || false,
		isLoading: pagination?.isLoading || false,
		onLoadMore: loadOlder,
		rootMargin: '140px 0px 0px'
	});

	const rememberScrollPosition = useCallback(
		(area: HTMLDivElement) => {
			messageScrollPositions.set(scrollMemoryKey, area.scrollTop);
		},
		[scrollMemoryKey]
	);

	const scrollToBottom = useCallback(
		(area: HTMLDivElement) => {
			area.scrollTop = area.scrollHeight;
			nearBottomRef.current = true;
			rememberScrollPosition(area);
		},
		[rememberScrollPosition]
	);

	useLayoutEffect(() => {
		const area = listRef.current;
		if (!area) return;

		if (!initializedScrollRef.current) {
			const savedScrollTop = messageScrollPositions.get(scrollMemoryKey);
			restoredFromMemoryRef.current = savedScrollTop !== undefined;
			if (savedScrollTop === undefined) scrollToBottom(area);
			else area.scrollTop = savedScrollTop;

			nearBottomRef.current = area.scrollHeight - area.scrollTop - area.clientHeight < 80;
			rememberScrollPosition(area);
			initializedScrollRef.current = true;
			previousMessageCountRef.current = messages.length;
			pendingScrollRef.current = undefined;
			return;
		}

		const pendingScroll = pendingScrollRef.current;
		if (
			pendingScroll?.conversationId === selectedConversationId &&
			messages.length > previousMessageCountRef.current
		) {
			area.scrollTop = area.scrollHeight - pendingScroll.scrollHeight + pendingScroll.scrollTop;
			pendingScrollRef.current = undefined;
		} else if (messages.length > previousMessageCountRef.current && nearBottomRef.current) {
			scrollToBottom(area);
		}

		previousMessageCountRef.current = messages.length;
		rememberScrollPosition(area);
	}, [messages.length, rememberScrollPosition, scrollMemoryKey, scrollToBottom, selectedConversationId]);

	useLayoutEffect(() => {
		const area = listRef.current;
		if (!area || !forceScrollRequest || lastAppliedForceScrollRef.current === forceScrollRequest.token) return;
		if (!messages.some(message => message.requestId === forceScrollRequest.requestId)) return;

		scrollToBottom(area);
		lastAppliedForceScrollRef.current = forceScrollRequest.token;
	}, [forceScrollRequest, messages, scrollToBottom]);

	useLayoutEffect(() => {
		return () => {
			const area = listRef.current;
			if (area) rememberScrollPosition(area);
		};
	}, [rememberScrollPosition]);

	useEffect(() => {
		const area = listRef.current;
		const content = contentRef.current;
		if (!area || !content || typeof ResizeObserver === 'undefined') return;

		let firstObservation = true;
		const observer = new ResizeObserver(() => {
			if (firstObservation) {
				firstObservation = false;
				if (!restoredFromMemoryRef.current && nearBottomRef.current) scrollToBottom(area);
				return;
			}
			if (pendingScrollRef.current || !nearBottomRef.current) return;
			scrollToBottom(area);
		});
		observer.observe(content);

		return () => observer.disconnect();
	}, [scrollToBottom]);

	const handleScroll = () => {
		const area = listRef.current;
		if (!area) return;
		nearBottomRef.current = area.scrollHeight - area.scrollTop - area.clientHeight < 80;
		rememberScrollPosition(area);
	};

	const handleUserScrollIntent = () => {
		userInteractedWithScrollRef.current = true;
	};

	const handleMediaLoad = () => {
		const area = listRef.current;
		if (!area || restoredFromMemoryRef.current || userInteractedWithScrollRef.current) return;
		scrollToBottom(area);
	};

	return (
		<div
			ref={listRef}
			aria-live="polite"
			onScroll={handleScroll}
			onWheel={handleUserScrollIntent}
			onTouchStart={handleUserScrollIntent}
			onPointerDown={handleUserScrollIntent}
			className="chat-pattern min-h-0 overflow-y-auto px-3 py-5 mobile:px-7 mobile:py-6 scrollbar-thin">
			<div ref={contentRef} className="flex min-h-full flex-col gap-3.5">
				<div ref={sentinelRef} className="flex min-h-1 shrink-0 flex-col" aria-live="polite">
					{pagination?.isLoading && <MessageListSkeleton count={2} />}
					{pagination?.error && !pagination.isLoading && (
						<Button
							theme="ghost"
							type="button"
							className="min-h-8 bg-white/90 px-3 text-xs shadow-sm dark:bg-[#18242b]/90"
							onClick={loadOlder}>
							Tentar carregar mensagens anteriores
						</Button>
					)}
				</div>

				<div className="flex justify-center">
					<span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs text-slate-500 shadow-panel dark:border-[#223138] dark:bg-[#0e181e]/90 dark:text-slate-400">
						Hoje
					</span>
				</div>

				{messages.map(message =>
					message.type === 'file' ? (
						<ChatFileMessage
							key={message.clientId || message.id}
							message={message}
							onRetry={onRetry}
							onMediaLoad={handleMediaLoad}
						/>
					) : (
						<ChatTextMessage key={message.clientId || message.id} message={message} onRetry={onRetry} />
					)
				)}
			</div>
		</div>
	);
};
