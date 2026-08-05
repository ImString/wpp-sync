import { MdArrowBack, MdMoreVert } from 'react-icons/md';
import { useNavigate, useParams } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@/components/buttons';
import { Image } from '@/components/shared/Image';

import { useChatStore } from '../store';

export const ChatHeader: React.FC = () => {
	const navigate = useNavigate();
	const { uid } = useParams<{ uid: string }>();
	const { contactPanelOpen, conversations, selectedConversationId, closeContactPanel, openContactPanel } =
		useChatStore(
			useShallow(state => ({
				contactPanelOpen: state.contactPanelOpen,
				conversations: state.conversations,
				selectedConversationId: state.selectedConversationId,
				closeContactPanel: state.closeContactPanel,
				openContactPanel: state.openContactPanel
			}))
		);
	const conversation = conversations.find(item => item.id === selectedConversationId) || conversations[0];
	const toggleContactPanel = () => (contactPanelOpen ? closeContactPanel() : openContactPanel());

	return (
		<header className="flex min-w-0 items-center gap-2.5 border-b border-slate-200 px-3.5 dark:border-[#223138]">
			<Button
				theme="ghost"
				type="button"
				aria-label="Voltar para conversas"
				className="icon-button mobile:hidden"
				onClick={() => navigate(uid ? `/w/${uid}/chats` : '/')}>
				<MdArrowBack aria-hidden="true" />
			</Button>

			<Image
				className={twMerge(
					'inline-grid w-10 h-10 flex-0 place-items-center rounded-full',
					conversation.avatarClassName
				)}
				seed={conversation.initials}
				collection="initials"
			/>
			<div className="flex min-w-0 flex-1 flex-col">
				<strong className="truncate text-sm">{conversation.name}</strong>
				<span className="mt-0.5 flex items-center gap-1 text-[10px] text-brand-600 dark:text-brand-500">
					<i className="size-1.5 rounded-full bg-brand-500" /> Cliente
				</span>
			</div>

			<Button
				theme="ghost"
				type="button"
				aria-label={contactPanelOpen ? 'Fechar dados do contato' : 'Abrir dados do contato'}
				aria-controls="contact-details-panel"
				aria-expanded={contactPanelOpen}
				className="icon-button"
				onClick={toggleContactPanel}>
				<MdMoreVert aria-hidden="true" />
			</Button>
		</header>
	);
};
