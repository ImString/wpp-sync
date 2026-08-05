import { create } from 'zustand';

import { formatNationalPhone } from '@/utils';

import { conversations as initialConversations, initialMessages } from './data';
import type { ChatStore } from './types';

const currentTime = () => {
	return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date());
};

const normalizePhone = (value: string) => value.replace(/\D/g, '');

const getInitials = (name: string) =>
	name
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map(part => part[0]?.toUpperCase())
		.join('');

export const useChatStore = create<ChatStore>(set => ({
	activeFilter: 'all',
	activeSection: 'chats',
	contactPanelOpen: false,
	conversations: initialConversations,
	messages: initialMessages,
	mobileView: 'conversations',
	newConversationOpen: false,
	search: '',
	selectedConversationId: 'juliana-costa',
	sidebarOpen: false,
	closeContactPanel: () =>
		set(state => ({
			contactPanelOpen: false,
			mobileView: state.mobileView === 'contact' ? 'chat' : state.mobileView
		})),
	closeNewConversation: () => set({ newConversationOpen: false }),
	closeSidebar: () => set({ sidebarOpen: false }),
	openContactPanel: () => set({ contactPanelOpen: true, mobileView: 'contact' }),
	openNewConversation: () => set({ newConversationOpen: true }),
	openSidebar: () => set({ sidebarOpen: true }),
	selectConversation: selectedConversationId =>
		set({ contactPanelOpen: false, selectedConversationId, mobileView: 'chat' }),
	startConversation: contact => {
		let conversationId = contact.id;

		set(state => {
			const phone = normalizePhone(contact.phone);
			const existingConversation = state.conversations.find(
				conversation => normalizePhone(conversation.phone) === phone
			);

			if (existingConversation) {
				conversationId = existingConversation.id;
				return {
					activeFilter: 'all',
					contactPanelOpen: false,
					mobileView: 'chat',
					newConversationOpen: false,
					search: '',
					selectedConversationId: existingConversation.id
				};
			}

			const conversation = {
				id: contact.id,
				name: contact.name,
				initials: getInitials(contact.name),
				preview: 'Nova conversa — envie a primeira mensagem.',
				time: 'Agora',
				type: 'all' as const,
				phone: formatNationalPhone(contact.phone) || contact.phone,
				avatarClassName: 'from-brand-500 to-emerald-700',
				tags: contact.tags || []
			};

			return {
				activeFilter: 'all',
				contactPanelOpen: false,
				conversations: [conversation, ...state.conversations],
				messages: { ...state.messages, [conversation.id]: [] },
				mobileView: 'chat',
				newConversationOpen: false,
				search: '',
				selectedConversationId: conversation.id
			};
		});

		return conversationId;
	},
	sendMessage: text => {
		const messageId = `message-${Date.now()}`;

		set(state => ({
			messages: {
				...state.messages,
				[state.selectedConversationId]: [
					...(state.messages[state.selectedConversationId] || []),
					{
						id: messageId,
						type: 'text',
						direction: 'sent',
						text,
						time: currentTime(),
						status: 'sent'
					}
				]
			}
		}));

		window.setTimeout(() => {
			set(state => ({
				messages: Object.fromEntries(
					Object.entries(state.messages).map(([conversationId, messages]) => [
						conversationId,
						messages.map(message =>
							message.id === messageId && message.type === 'text'
								? { ...message, status: 'read' }
								: message
						)
					])
				)
			}));
		}, 900);
	},
	setActiveFilter: activeFilter => set({ activeFilter }),
	setActiveSection: activeSection => set({ activeSection, sidebarOpen: false }),
	setMobileView: mobileView => set({ mobileView }),
	setSearch: search => set({ search })
}));
