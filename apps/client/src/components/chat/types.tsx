export type ConversationFilter = 'all' | 'unread' | 'waiting' | 'groups';
export type ConversationChannel = 'WHATSAPP' | 'WEB' | 'INSTAGRAM' | 'MESSENGER';
export type MobileView = 'conversations' | 'chat' | 'contact';
export type ChatLoadStatus = 'idle' | 'loading' | 'ready' | 'error';
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
	channel?: ConversationChannel;
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

export type MessageDeliveryStatus = 'sending' | 'sent' | 'read' | 'error';
export type MessageFileKind = 'image' | 'audio' | 'video' | 'file';

export interface MessageDeliveryState {
	status?: MessageDeliveryStatus;
	requestId?: string;
	clientId?: string;
	error?: string;
}

export interface TextMessage extends MessageDeliveryState {
	id: string;
	type: 'text';
	direction: 'received' | 'sent';
	text: string;
	time: string;
}

export interface FileMessage extends MessageDeliveryState {
	id: string;
	type: 'file';
	direction: 'received' | 'sent';
	name: string;
	details: string;
	caption?: string;
	fileKind?: MessageFileKind;
	mimeType?: string;
	previewUrl?: string;
	size?: number;
	time: string;
	url?: string;
}

export type ChatMessage = TextMessage | FileMessage;

export interface MessagePaginationState {
	hasMore: boolean;
	isLoading: boolean;
	nextCursor?: string;
	error?: string;
}

export interface MessageSendInput {
	text: string;
	files: File[];
}

export interface MessageSendRequest extends MessageSendInput {
	requestId: string;
	workspaceUid: string;
	conversationId: string;
	optimisticMessages: ChatMessage[];
}

export interface ChatStore {
	activeFilter: ConversationFilter;
	activeSection: NavigationSection;
	contactPanelOpen: boolean;
	conversations: Conversation[];
	conversationsError?: string;
	conversationsHasMore: boolean;
	conversationsIsLoadingMore: boolean;
	conversationsPage: number;
	conversationsStatus: ChatLoadStatus;
	conversationsTotal: number;
	messages: Record<string, ChatMessage[]>;
	messagesPagination: Record<string, MessagePaginationState>;
	mobileView: MobileView;
	newConversationOpen: boolean;
	search: string;
	selectedConversationId: string;
	sidebarOpen: boolean;
	workspaceUid?: string;
	closeContactPanel: () => void;
	closeNewConversation: () => void;
	closeSidebar: () => void;
	initializeConversations: (workspaceUid: string, force?: boolean) => Promise<void>;
	loadMoreConversations: (workspaceUid: string) => Promise<void>;
	loadOlderMessages: (workspaceUid: string, conversationId: string) => Promise<number>;
	openContactPanel: () => void;
	openNewConversation: () => void;
	openSidebar: () => void;
	selectConversation: (conversationId: string) => void;
	startConversation: (contact: ConversationContact) => string;
	sendMessage: (request: MessageSendRequest) => Promise<void>;
	setActiveFilter: (filter: ConversationFilter) => void;
	setActiveSection: (section: NavigationSection) => void;
	setMobileView: (view: MobileView) => void;
	setSearch: (search: string) => void;
}
