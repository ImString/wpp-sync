import { useEffect, useState } from 'react';

import { useChatStore } from '../store';

export const ContactNotes: React.FC = () => {
	const conversations = useChatStore(state => state.conversations);
	const selectedConversationId = useChatStore(state => state.selectedConversationId);
	const conversation = conversations.find(item => item.id === selectedConversationId) || conversations[0];
	const isWebConversation = conversation.channel === 'WEB';
	const [notes, setNotes] = useState(conversation.notes || '');

	useEffect(() => {
		setNotes(conversation.notes || '');
	}, [conversation.id, conversation.notes]);

	return (
		<section className="border-b border-slate-200 p-4.5 dark:border-[#223138]">
			<h3 className="text-xs font-semibold">Notas</h3>
			<textarea
				rows={4}
				value={notes}
				onChange={event => setNotes(event.target.value)}
				placeholder={
					isWebConversation ? 'Notas indisponíveis para conversas do site.' : 'Adicionar uma nota...'
				}
				aria-label="Notas do contato"
				disabled={isWebConversation}
				className="mt-3 w-full resize-y rounded-xl border border-slate-200 bg-slate-100 p-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#223138] dark:bg-[#131f26] dark:focus:bg-[#0e181e]"
			/>
		</section>
	);
};
