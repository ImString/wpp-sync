import { useEffect } from 'react';
import { MdChatBubbleOutline } from 'react-icons/md';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';

import { ContactPanel } from '../contact';
import { ChatPanel, MessageListSkeleton } from '../messages';
import { useChatStore } from '../store';

export const ChatEmptyRoute: React.FC = () => {
	const { closeContactPanel, setMobileView } = useChatStore(
		useShallow(state => ({
			closeContactPanel: state.closeContactPanel,
			setMobileView: state.setMobileView
		}))
	);

	useEffect(() => {
		closeContactPanel();
		setMobileView('conversations');
	}, [closeContactPanel, setMobileView]);

	return (
		<section className="hidden min-h-0 place-items-center border-l border-slate-200 bg-slate-50 px-6 text-center mobile:grid dark:border-[#223138] dark:bg-[#0b151a]">
			<div className="max-w-72">
				<span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-[#0f3826] dark:text-brand-400">
					<MdChatBubbleOutline className="size-7" aria-hidden="true" />
				</span>
				<h2 className="mt-4 text-base font-semibold">Selecione uma conversa</h2>
				<p className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
					Escolha um chat na lista para visualizar as mensagens.
				</p>
			</div>
		</section>
	);
};

export const ChatConversationRoute: React.FC = () => {
	const { chatId, uid } = useParams<{ chatId: string; uid: string }>();

	const { conversations, conversationsStatus, selectedConversationId, selectConversation } = useChatStore(
		useShallow(state => ({
			conversations: state.conversations,
			conversationsStatus: state.conversationsStatus,
			selectedConversationId: state.selectedConversationId,
			selectConversation: state.selectConversation
		}))
	);
	const conversationExists = conversations.some(conversation => conversation.id === chatId);

	useEffect(() => {
		if (chatId && conversationExists && selectedConversationId !== chatId) {
			selectConversation(chatId);
		}
	}, [chatId, conversationExists, selectConversation, selectedConversationId]);

	if (!uid || !chatId) {
		return <Navigate to={uid ? `/w/${uid}/chats` : '/'} replace />;
	}

	if (!conversationExists && (conversationsStatus === 'idle' || conversationsStatus === 'loading')) {
		return (
			<section className="chat-panel mobile-screen grid min-h-0 grid-rows-[74px_minmax(0,1fr)_auto] overflow-hidden border-r border-slate-200 bg-white dark:border-[#223138] dark:bg-[#0e181e]">
				<header
					className="flex animate-pulse items-center gap-3 border-b border-slate-200 px-3.5 motion-reduce:animate-none dark:border-[#223138]"
					aria-hidden="true">
					<span className="size-10 shrink-0 rounded-full bg-slate-200 dark:bg-[#1b2a31]" />
					<span className="flex-1 space-y-2">
						<span className="block h-2.5 w-32 rounded-full bg-slate-200 dark:bg-[#1b2a31]" />
						<span className="block h-2 w-20 rounded-full bg-slate-100 dark:bg-[#17262e]" />
					</span>
				</header>
				<div className="chat-pattern flex min-h-0 flex-col justify-end overflow-hidden px-3 py-5 mobile:px-7 mobile:py-6">
					<MessageListSkeleton count={5} />
				</div>
				<footer
					className="flex min-h-16 animate-pulse items-center gap-2 border-t border-slate-200 p-2 motion-reduce:animate-none dark:border-[#223138] mobile:min-h-17.5 mobile:px-3.5 mobile:py-2.5"
					aria-hidden="true">
					<span className="h-11 flex-1 rounded-xl bg-slate-100 dark:bg-[#17262e]" />
					<span className="size-10.5 rounded-xl bg-slate-200 dark:bg-[#1b2a31]" />
				</footer>
			</section>
		);
	}

	if (!conversationExists) return <Navigate to={`/w/${uid}/chats`} replace />;

	if (selectedConversationId !== chatId) return null;

	return (
		<>
			<ChatPanel />
			<ContactPanel />
		</>
	);
};
