import { create } from 'zustand';

import { initialMessages } from './data';
import type { ChatStore } from './types';

const currentTime = () => {
	return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date());
};

export const useChatStore = create<ChatStore>(set => ({
	activeFilter: 'all',
	activeSection: 'chats',
	contactPanelOpen: false,
	messages: initialMessages,
	mobileView: 'conversations',
	search: '',
	selectedConversationId: 'juliana-costa',
	sidebarOpen: false,
	closeContactPanel: () =>
		set(state => ({
			contactPanelOpen: false,
			mobileView: state.mobileView === 'contact' ? 'chat' : state.mobileView
		})),
	closeSidebar: () => set({ sidebarOpen: false }),
	openContactPanel: () => set({ contactPanelOpen: true, mobileView: 'contact' }),
	openSidebar: () => set({ sidebarOpen: true }),
	selectConversation: selectedConversationId => set({ selectedConversationId, mobileView: 'chat' }),
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
