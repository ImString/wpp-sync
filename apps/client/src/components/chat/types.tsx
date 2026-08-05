export type ConversationFilter = 'all' | 'unread' | 'waiting' | 'groups';
export type MobileView = 'conversations' | 'chat' | 'contact';
export type NavigationSection =
	| 'chats'
	| 'contacts'
	| 'campaigns'
	| 'automations'
	| 'reports'
	| 'integrations'
	| 'settings';

export interface Conversation {
	id: string;
	name: string;
	displayName?: string;
	initials: string;
	preview: string;
	time: string;
	type: Exclude<ConversationFilter, 'all'> | 'all';
	unread?: number;
	phone: string;
	avatarClassName: string;
	tags: string[];
}

export interface ConversationContact {
	id: string;
	name: string;
	phone: string;
	tags?: string[];
}

export interface TextMessage {
	id: string;
	type: 'text';
	direction: 'received' | 'sent';
	text: string;
	time: string;
	status?: 'sent' | 'read';
}

export interface FileMessage {
	id: string;
	type: 'file';
	direction: 'received';
	name: string;
	details: string;
	time: string;
}

export type ChatMessage = TextMessage | FileMessage;

export interface ChatStore {
	activeFilter: ConversationFilter;
	activeSection: NavigationSection;
	contactPanelOpen: boolean;
	conversations: Conversation[];
	messages: Record<string, ChatMessage[]>;
	mobileView: MobileView;
	newConversationOpen: boolean;
	search: string;
	selectedConversationId: string;
	sidebarOpen: boolean;
	closeContactPanel: () => void;
	closeNewConversation: () => void;
	closeSidebar: () => void;
	openContactPanel: () => void;
	openNewConversation: () => void;
	openSidebar: () => void;
	selectConversation: (conversationId: string) => void;
	startConversation: (contact: ConversationContact) => string;
	sendMessage: (text: string) => void;
	setActiveFilter: (filter: ConversationFilter) => void;
	setActiveSection: (section: NavigationSection) => void;
	setMobileView: (view: MobileView) => void;
	setSearch: (search: string) => void;
}
