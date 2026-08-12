import { useEffect, useState } from 'react';
import { MdArrowBack, MdCheckCircleOutline, MdMoreVert } from 'react-icons/md';
import { useNavigate, useParams } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@/components/buttons';
import { Image } from '@/components/shared/Image';

import { useChatStore } from '../store';

interface CloseConversationDialogProps {
	conversationName: string;
	error?: string;
	loading: boolean;
	onCancel: () => void;
	onConfirm: () => void;
}

const CloseConversationDialog: React.FC<CloseConversationDialogProps> = props => {
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && !props.loading) props.onCancel();
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [props.loading, props.onCancel]);

	return (
		<div
			className="fixed inset-0 z-60 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-[3px] mobile:items-center mobile:p-5"
			role="presentation"
			onMouseDown={event => {
				if (event.target === event.currentTarget && !props.loading) props.onCancel();
			}}>
			<section
				role="alertdialog"
				aria-modal="true"
				aria-labelledby="close-conversation-title"
				aria-describedby="close-conversation-description"
				className="w-full rounded-t-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-[#223138] dark:bg-[#0e181e] mobile:max-w-105 mobile:rounded-[22px]">
				<span className="grid size-11 place-items-center rounded-2xl bg-brand-50 text-xl text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
					<MdCheckCircleOutline aria-hidden="true" />
				</span>
				<h2 id="close-conversation-title" className="mt-4 text-base font-bold">
					Fechar conversa?
				</h2>
				<p
					id="close-conversation-description"
					className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
					A conversa com “{props.conversationName}” sairá da lista de conversas abertas e não poderá receber
					novas mensagens.
				</p>
				{props.error && (
					<p role="alert" className="mt-3 text-xs text-red-500">
						{props.error}
					</p>
				)}
				<div className="mt-5 flex justify-end gap-2">
					<Button theme="secondary" type="button" autoFocus disabled={props.loading} onClick={props.onCancel}>
						Cancelar
					</Button>
					<Button
						theme="primary"
						type="button"
						loading={props.loading}
						loadingLabel="Fechando..."
						onClick={props.onConfirm}>
						Fechar conversa
					</Button>
				</div>
			</section>
		</div>
	);
};

export const ChatHeader: React.FC = () => {
	const navigate = useNavigate();
	const { uid } = useParams<{ uid: string }>();
	const {
		contactPanelOpen,
		conversations,
		selectedConversationId,
		closeContactPanel,
		closeConversation,
		openContactPanel
	} = useChatStore(
		useShallow(state => ({
			contactPanelOpen: state.contactPanelOpen,
			conversations: state.conversations,
			selectedConversationId: state.selectedConversationId,
			closeContactPanel: state.closeContactPanel,
			closeConversation: state.closeConversation,
			openContactPanel: state.openContactPanel
		}))
	);
	const [closeDialogOpen, setCloseDialogOpen] = useState(false);
	const [closing, setClosing] = useState(false);
	const [closeError, setCloseError] = useState<string>();
	const conversation = conversations.find(item => item.id === selectedConversationId) || conversations[0];
	const toggleContactPanel = () => (contactPanelOpen ? closeContactPanel() : openContactPanel());
	const openCloseDialog = () => {
		setCloseError(undefined);
		setCloseDialogOpen(true);
	};
	const closeCloseDialog = () => {
		if (closing) return;
		setCloseDialogOpen(false);
		setCloseError(undefined);
	};
	const handleCloseConversation = async () => {
		if (!uid || !conversation || closing) return;

		setClosing(true);
		setCloseError(undefined);

		try {
			await closeConversation(uid, conversation.id);
			navigate(`/w/${uid}/chats`, { replace: true });
		} catch (error) {
			setCloseError(error instanceof Error ? error.message : 'Não foi possível fechar a conversa.');
			setClosing(false);
		}
	};

	return (
		<>
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
					<span className="mt-0.5 flex items-center gap-1 text-xs text-brand-600 dark:text-brand-500">
						<i className="size-1.5 rounded-full bg-brand-500" /> Cliente
					</span>
				</div>

				<Button
					theme="secondary"
					type="button"
					aria-label="Fechar conversa"
					title="Fechar conversa"
					className="min-h-9 shrink-0 px-2.5 text-xs"
					onClick={openCloseDialog}>
					<MdCheckCircleOutline className="size-5" aria-hidden="true" />
					<span className="hidden drawer:inline">Fechar conversa</span>
				</Button>

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

			{closeDialogOpen && (
				<CloseConversationDialog
					conversationName={conversation.name}
					error={closeError}
					loading={closing}
					onCancel={closeCloseDialog}
					onConfirm={() => void handleCloseConversation()}
				/>
			)}
		</>
	);
};
