import { useChatStore } from '../store';
import type { ConversationChannel } from '../types';

const channelNames: Record<ConversationChannel, string> = {
	WHATSAPP: 'WhatsApp',
	WEB: 'Chat do site',
	INSTAGRAM: 'Instagram',
	MESSENGER: 'Messenger'
};

const parseDate = (value?: string) => {
	if (!value) return undefined;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? undefined : date;
};

const formatDate = (value?: string) => {
	const date = parseDate(value);
	return date
		? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
		: 'Não informado';
};

const formatLastInteraction = (value?: string) => {
	const date = parseDate(value);
	if (!date) return 'Não informada';

	const now = new Date();
	const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	const daysAgo = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86_400_000);
	const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date);

	if (daysAgo === 0) return `Hoje às ${time}`;
	if (daysAgo === 1) return `Ontem às ${time}`;
	return `${formatDate(value)} às ${time}`;
};

export const ContactInformation: React.FC = () => {
	const conversations = useChatStore(state => state.conversations);
	const selectedConversationId = useChatStore(state => state.selectedConversationId);
	const conversation = conversations.find(item => item.id === selectedConversationId) || conversations[0];
	const origin = conversation.origin || (conversation.channel ? channelNames[conversation.channel] : 'Não informada');

	return (
		<section className="border-b border-slate-200 p-4.5 dark:border-[#223138]">
			<h3 className="text-xs font-semibold">Informações</h3>
			<dl className="mt-3.5 grid gap-3 text-[11px]">
				<div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2.5">
					<dt className="text-slate-500 dark:text-slate-400">Primeiro contato</dt>
					<dd className="text-right">{formatDate(conversation.firstContactAt)}</dd>
				</div>
				<div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2.5">
					<dt className="text-slate-500 dark:text-slate-400">Última interação</dt>
					<dd className="text-right">{formatLastInteraction(conversation.lastActivityAt)}</dd>
				</div>
				<div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2.5">
					<dt className="text-slate-500 dark:text-slate-400">Origem</dt>
					<dd className="text-right">{origin}</dd>
				</div>
			</dl>
		</section>
	);
};
