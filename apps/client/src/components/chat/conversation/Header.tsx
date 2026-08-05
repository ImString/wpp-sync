import { MdAdd } from 'react-icons/md';

import { Button } from '@/components/buttons';

import { useChatStore } from '../store';

export const ConversationHeader: React.FC = () => {
	const openNewConversation = useChatStore(state => state.openNewConversation);

	return (
		<header className="flex min-h-21 items-center justify-between px-4.5 pb-2.5 pt-4">
			<div>
				<p className="mb-1 text-[11px] font-bold uppercase tracking-[.09em] text-brand-600 dark:text-brand-500">
					Central de atendimento
				</p>
				<h1 className="text-2xl font-bold tracking-[-.04em]">Conversas</h1>
			</div>
			<Button
				theme="ghost"
				type="button"
				aria-label="Nova conversa"
				className="icon-button"
				onClick={openNewConversation}>
				<MdAdd aria-hidden="true" />
			</Button>
		</header>
	);
};
