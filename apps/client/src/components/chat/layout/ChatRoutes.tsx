import { useEffect } from 'react';
import { MdChatBubbleOutline } from 'react-icons/md';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';

import { ContactPanel } from '../contact';
import { conversations } from '../data';
import { ChatPanel } from '../messages';
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

	const { selectedConversationId, selectConversation } = useChatStore(
		useShallow(state => ({
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

	if (!uid || !chatId || !conversationExists) {
		return <Navigate to={uid ? `/w/${uid}/chats` : '/'} replace />;
	}

	if (selectedConversationId !== chatId) return null;

	return (
		<>
			<ChatPanel />
			<ContactPanel />
		</>
	);
};
