import { MdCall, MdEdit, MdWhatsapp } from 'react-icons/md';

import { Button } from '@/components/buttons';

import { useChatStore } from '../store';

export const ContactActions: React.FC = () => {
	const conversations = useChatStore(state => state.conversations);
	const selectedConversationId = useChatStore(state => state.selectedConversationId);
	const conversation = conversations.find(item => item.id === selectedConversationId) || conversations[0];
	const isWebConversation = conversation.channel === 'WEB';
	const disabledTitle = isWebConversation ? 'Indisponível para conversas do site' : undefined;

	return (
		<footer className="mt-auto grid grid-cols-3 gap-1.5 px-3 py-4">
			<Button
				theme="unstyled"
				type="button"
				title={disabledTitle}
				disabled={isWebConversation}
				className="contact-action">
				<MdCall aria-hidden="true" />
				<span>Ligar</span>
			</Button>
			<Button
				theme="unstyled"
				type="button"
				title={disabledTitle}
				disabled={isWebConversation}
				className="contact-action">
				<MdWhatsapp aria-hidden="true" />
				<span>WhatsApp</span>
			</Button>
			<Button
				theme="unstyled"
				type="button"
				title={disabledTitle}
				disabled={isWebConversation}
				className="contact-action">
				<MdEdit aria-hidden="true" />
				<span>Editar</span>
			</Button>
		</footer>
	);
};
