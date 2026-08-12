import { create } from 'zustand';

import { formatNationalPhone } from '@/utils';
import { conversationsAPI, getResponseMessage, type ConversationData, type ConversationMessageData } from '@/utils/api';

import { formatMessageSummary } from './format-message-summary';
import type {
	ChatMessage,
	ChatStore,
	Conversation,
	FileMessage,
	MessageFileKind,
	MessagePaginationState,
	MessageSendInput,
	MessageSendRequest
} from './types';

const CONVERSATION_PAGE_SIZE = 20;
const PRELOADED_MESSAGE_LIMIT = 4;
const MESSAGE_PAGE_SIZE = 30;

let conversationsRequest: AbortController | undefined;
const messageSendRequests = new Map<string, MessageSendRequest>();

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

const parseDate = (value?: string) => {
	if (!value) return undefined;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? undefined : date;
};

const formatMessageTime = (value?: string) => {
	const date = parseDate(value);
	return date ? new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date) : '';
};

const formatConversationTime = (value?: string) => {
	const date = parseDate(value);
	if (!date) return '';

	const today = new Date();
	const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
	const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	const daysAgo = Math.floor((startOfToday.getTime() - startOfDate.getTime()) / 86_400_000);

	if (daysAgo === 0) return formatMessageTime(value);
	if (daysAgo === 1) return 'Ontem';
	if (daysAgo > 1 && daysAgo < 7) {
		return new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(date).replace('.', '');
	}

	return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(date);
};

const comparePositions = (left?: string, right?: string) => {
	try {
		const leftPosition = BigInt(left || 0);
		const rightPosition = BigInt(right || 0);
		return leftPosition < rightPosition ? -1 : leftPosition > rightPosition ? 1 : 0;
	} catch {
		return Number(left || 0) - Number(right || 0);
	}
};

const sortMessages = (messages: ConversationMessageData[]) => {
	return [...messages].sort((left, right) => {
		const positionComparison = comparePositions(left.position, right.position);
		if (positionComparison) return positionComparison;
		return (parseDate(left.createdAt)?.getTime() || 0) - (parseDate(right.createdAt)?.getTime() || 0);
	});
};

const getPayloadRecord = (payload: unknown) => {
	return payload && typeof payload === 'object' && !Array.isArray(payload)
		? (payload as Record<string, unknown>)
		: undefined;
};

const getPayloadString = (payload: Record<string, unknown> | undefined, keys: string[]) => {
	for (const key of keys) {
		const value = payload?.[key];
		if (typeof value === 'string' && value.trim()) return value;
	}
	return undefined;
};

const getPayloadNumber = (payload: Record<string, unknown> | undefined, key: string) => {
	const value = payload?.[key];
	return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
};

const getFileKind = (mimeType?: string): MessageFileKind => {
	if (mimeType?.startsWith('image/')) return 'image';
	if (mimeType?.startsWith('audio/')) return 'audio';
	if (mimeType?.startsWith('video/')) return 'video';
	return 'file';
};

const formatFileSize = (size?: number) => {
	if (size === undefined) return '';
	if (size < 1024) return `${size} B`;
	if (size < 1024 * 1024) return `${(size / 1024).toFixed(size < 10 * 1024 ? 1 : 0)} KB`;
	return `${(size / (1024 * 1024)).toFixed(size < 10 * 1024 * 1024 ? 1 : 0)} MB`;
};

const getFileDetails = (mimeType?: string, size?: number) => {
	return [mimeType, formatFileSize(size)].filter(Boolean).join(' · ');
};

const mapMessage = (message: ConversationMessageData): ChatMessage => {
	const direction = message.sender?.type === 'MEMBER' ? 'sent' : 'received';
	const time = formatMessageTime(message.createdAt);

	if (!message.type || message.type === 'TEXT' || message.type === 'SYSTEM') {
		return {
			id: message.id,
			type: 'text',
			direction,
			text: message.text || (message.type === 'SYSTEM' ? 'Atualização da conversa' : ''),
			time,
			...(direction === 'sent' && { status: 'sent' as const })
		};
	}

	const payload = getPayloadRecord(message.payload);
	const mimeType = getPayloadString(payload, ['mimeType', 'mimetype']);
	const size = getPayloadNumber(payload, 'size');
	const defaultName =
		message.type === 'IMAGE'
			? 'Imagem'
			: message.type === 'AUDIO'
				? 'Áudio'
				: message.type === 'VIDEO'
					? 'Vídeo'
					: 'Arquivo';

	return {
		id: message.id,
		type: 'file',
		direction,
		name: getPayloadString(payload, ['name', 'filename', 'fileName']) || message.text || defaultName,
		details: getFileDetails(mimeType, size) || getPayloadString(payload, ['type']) || message.type,
		caption: message.text,
		fileKind:
			message.type === 'IMAGE'
				? 'image'
				: message.type === 'AUDIO'
					? 'audio'
					: message.type === 'VIDEO'
						? 'video'
						: getFileKind(mimeType),
		mimeType,
		size,
		time,
		url: getPayloadString(payload, ['url']),
		...(direction === 'sent' && { status: 'sent' as const })
	};
};

const createRequestId = () => {
	if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
	return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const createFilePreview = (file: File) => {
	return file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
};

export const createMessageSendRequest = (
	workspaceUid: string,
	conversationId: string,
	input: MessageSendInput
): MessageSendRequest => {
	const requestId = createRequestId();
	const text = input.text.trim();
	const optimisticMessages: ChatMessage[] =
		input.files.length > 0
			? input.files.map<FileMessage>((file, index) => ({
					id: `optimistic-${requestId}-${index}`,
					type: 'file',
					direction: 'sent',
					name: file.name,
					details: getFileDetails(file.type || 'application/octet-stream', file.size),
					...(index === input.files.length - 1 && text && { caption: text }),
					fileKind: getFileKind(file.type),
					mimeType: file.type || 'application/octet-stream',
					previewUrl: createFilePreview(file),
					requestId,
					size: file.size,
					status: 'sending',
					time: currentTime()
				}))
			: [
					{
						id: `optimistic-${requestId}`,
						type: 'text',
						direction: 'sent',
						text,
						time: currentTime(),
						requestId,
						status: 'sending'
					}
				];

	const request = {
		requestId,
		workspaceUid,
		conversationId,
		text,
		files: input.files,
		optimisticMessages
	};

	messageSendRequests.set(requestId, request);
	return request;
};

export const getMessageSendRequest = (requestId: string) => messageSendRequests.get(requestId);

const releaseMessageSendRequest = (request: MessageSendRequest) => {
	messageSendRequests.delete(request.requestId);
	window.setTimeout(
		() => {
			for (const message of request.optimisticMessages) {
				if (message.type === 'file' && message.previewUrl) URL.revokeObjectURL(message.previewUrl);
			}
		},
		5 * 60 * 1000
	);
};

const avatarGradients = [
	'from-orange-700 to-cyan-800',
	'from-slate-700 to-orange-400',
	'from-rose-900 to-orange-400',
	'from-emerald-400 to-emerald-700',
	'from-slate-800 to-amber-700',
	'from-teal-700 to-orange-300',
	'from-brand-600 to-brand-400'
];

const getAvatarGradient = (id: string) => {
	const hash = [...id].reduce((total, character) => total + character.charCodeAt(0), 0);
	return avatarGradients[hash % avatarGradients.length]!;
};

interface NormalizedConversation {
	conversation: Conversation;
	messages: ChatMessage[];
	pagination: MessagePaginationState;
}

const normalizeConversation = (data: ConversationData): NormalizedConversation => {
	const participants = data.participants || [];
	const externalParticipants = participants.filter(participant => participant.type !== 'MEMBER');
	const primaryParticipant = externalParticipants[0] || participants[0];
	const contact = primaryParticipant?.contact;
	const name =
		data.name?.trim() ||
		contact?.name?.trim() ||
		contact?.pushName?.trim() ||
		primaryParticipant?.name?.trim() ||
		contact?.whatsapp ||
		primaryParticipant?.email ||
		'Conversa';
	const sortedMessages = sortMessages(data.messages || []);
	const latestMessage = sortedMessages.at(-1);
	const isGroup = externalParticipants.length > 1;
	const isUnread = participants
		.filter(participant => participant.type === 'MEMBER')
		.some(participant => comparePositions(participant.lastReadPosition, latestMessage?.position) < 0);
	const isWaiting = latestMessage?.sender?.type !== 'MEMBER';
	const phone = contact?.whatsapp
		? formatNationalPhone(contact.whatsapp) || contact.whatsapp
		: primaryParticipant?.email || (isGroup ? `${externalParticipants.length} participantes` : '');
	const email = contact?.email?.trim() || primaryParticipant?.email?.trim();
	const nextCursor = sortedMessages[0]?.position;

	return {
		conversation: {
			id: data.id,
			...(data.integration?.type && { channel: data.integration.type }),
			name,
			initials: getInitials(name) || 'C',
			preview: formatMessageSummary(latestMessage),
			time: formatConversationTime(data.lastActivityAt || latestMessage?.createdAt || data.createdAt),
			type: isGroup ? 'groups' : isUnread ? 'unread' : isWaiting ? 'waiting' : 'all',
			...(isUnread && { unread: 1 }),
			phone,
			...(email && { email }),
			avatarClassName: getAvatarGradient(data.id),
			tags: contact?.tags || [],
			notes: contact?.notes || '',
			...((contact?.createdAt || primaryParticipant?.joinedAt || data.createdAt) && {
				firstContactAt: contact?.createdAt || primaryParticipant?.joinedAt || data.createdAt
			}),
			...((data.lastActivityAt || latestMessage?.createdAt || data.createdAt) && {
				lastActivityAt: data.lastActivityAt || latestMessage?.createdAt || data.createdAt
			}),
			...(data.integration?.name?.trim() && { origin: data.integration.name.trim() })
		},
		messages: sortedMessages.map(mapMessage),
		pagination: {
			hasMore: sortedMessages.length >= PRELOADED_MESSAGE_LIMIT && Boolean(nextCursor),
			isLoading: false,
			...(nextCursor && { nextCursor })
		}
	};
};

const hydrateMessages = (
	messages: Record<string, ChatMessage[]>,
	pagination: Record<string, MessagePaginationState>,
	conversations: NormalizedConversation[]
) => {
	const nextMessages = { ...messages };
	const nextPagination = { ...pagination };

	for (const item of conversations) {
		if (!(item.conversation.id in nextMessages)) nextMessages[item.conversation.id] = item.messages;
		if (!(item.conversation.id in nextPagination)) nextPagination[item.conversation.id] = item.pagination;
	}

	return { messages: nextMessages, messagesPagination: nextPagination };
};

export const useChatStore = create<ChatStore>((set, get) => ({
	activeFilter: 'all',
	activeSection: 'chats',
	contactPanelOpen: false,
	conversations: [],
	conversationsHasMore: true,
	conversationsIsLoadingMore: false,
	conversationsPage: 0,
	conversationsStatus: 'idle',
	conversationsTotal: 0,
	messages: {},
	messagesPagination: {},
	mobileView: 'conversations',
	newConversationOpen: false,
	search: '',
	selectedConversationId: '',
	sidebarOpen: false,
	closeContactPanel: () =>
		set(state => ({
			contactPanelOpen: false,
			mobileView: state.mobileView === 'contact' ? 'chat' : state.mobileView
		})),
	closeNewConversation: () => set({ newConversationOpen: false }),
	closeSidebar: () => set({ sidebarOpen: false }),
	initializeConversations: async (workspaceUid, force = false) => {
		const currentState = get();
		const isCurrentWorkspace = currentState.workspaceUid === workspaceUid;

		if (
			!force &&
			isCurrentWorkspace &&
			(currentState.conversationsStatus === 'loading' || currentState.conversationsStatus === 'ready')
		) {
			return;
		}

		conversationsRequest?.abort();
		const controller = new AbortController();
		conversationsRequest = controller;

		set({
			workspaceUid,
			conversations: [],
			conversationsError: undefined,
			conversationsHasMore: true,
			conversationsIsLoadingMore: false,
			conversationsPage: 0,
			conversationsStatus: 'loading',
			conversationsTotal: 0,
			messages: {},
			messagesPagination: {},
			...(!isCurrentWorkspace && { selectedConversationId: '' })
		});

		try {
			const response = await conversationsAPI.list(workspaceUid, {
				page: 1,
				limit: CONVERSATION_PAGE_SIZE,
				signal: controller.signal
			});

			if (!response.success || !response.data) {
				throw new Error(getResponseMessage(response, 'Não foi possível carregar as conversas.'));
			}
			if (controller.signal.aborted || get().workspaceUid !== workspaceUid) return;

			const normalized = response.data.items.map(normalizeConversation);
			const hydrated = hydrateMessages({}, {}, normalized);

			set({
				conversations: normalized.map(item => item.conversation),
				conversationsHasMore: normalized.length < response.data.total,
				conversationsPage: 1,
				conversationsStatus: 'ready',
				conversationsTotal: response.data.total,
				...hydrated
			});
		} catch (error) {
			if (controller.signal.aborted || get().workspaceUid !== workspaceUid) return;

			set({
				conversationsError: error instanceof Error ? error.message : 'Não foi possível carregar as conversas.',
				conversationsHasMore: false,
				conversationsStatus: 'error'
			});
		} finally {
			if (conversationsRequest === controller) conversationsRequest = undefined;
		}
	},
	loadMoreConversations: async workspaceUid => {
		const currentState = get();
		if (
			currentState.workspaceUid !== workspaceUid ||
			currentState.conversationsStatus !== 'ready' ||
			currentState.conversationsIsLoadingMore ||
			!currentState.conversationsHasMore
		) {
			return;
		}

		const nextPage = currentState.conversationsPage + 1;
		set({ conversationsError: undefined, conversationsIsLoadingMore: true });

		try {
			const response = await conversationsAPI.list(workspaceUid, {
				page: nextPage,
				limit: CONVERSATION_PAGE_SIZE
			});

			if (!response.success || !response.data) {
				throw new Error(getResponseMessage(response, 'Não foi possível carregar mais conversas.'));
			}
			if (get().workspaceUid !== workspaceUid) return;

			const normalized = response.data.items.map(normalizeConversation);
			set(state => {
				if (state.workspaceUid !== workspaceUid) return state;

				const knownIds = new Set(state.conversations.map(conversation => conversation.id));
				const newConversations = normalized
					.map(item => item.conversation)
					.filter(conversation => !knownIds.has(conversation.id));
				const conversations = [...state.conversations, ...newConversations];

				return {
					conversations,
					conversationsHasMore:
						response.data!.items.length > 0 && conversations.length < response.data!.total,
					conversationsIsLoadingMore: false,
					conversationsPage: nextPage,
					conversationsTotal: response.data!.total,
					...hydrateMessages(state.messages, state.messagesPagination, normalized)
				};
			});
		} catch (error) {
			if (get().workspaceUid !== workspaceUid) return;

			set({
				conversationsError:
					error instanceof Error ? error.message : 'Não foi possível carregar mais conversas.',
				conversationsIsLoadingMore: false
			});
		}
	},
	loadOlderMessages: async (workspaceUid, conversationId) => {
		const currentState = get();
		const currentPagination = currentState.messagesPagination[conversationId];

		if (
			currentState.workspaceUid !== workspaceUid ||
			!currentPagination?.hasMore ||
			currentPagination.isLoading ||
			!currentPagination.nextCursor
		) {
			return 0;
		}

		set(state => ({
			messagesPagination: {
				...state.messagesPagination,
				[conversationId]: {
					...currentPagination,
					isLoading: true,
					error: undefined
				}
			}
		}));

		try {
			const response = await conversationsAPI.listMessages(workspaceUid, conversationId, {
				cursor: currentPagination.nextCursor,
				limit: MESSAGE_PAGE_SIZE
			});

			if (!response.success || !response.data) {
				throw new Error(getResponseMessage(response, 'Não foi possível carregar as mensagens anteriores.'));
			}
			if (get().workspaceUid !== workspaceUid) return 0;

			const olderMessages = sortMessages(response.data.items).map(mapMessage);
			let addedCount = 0;

			set(state => {
				if (state.workspaceUid !== workspaceUid) return state;

				const currentMessages = state.messages[conversationId] || [];
				const knownIds = new Set(currentMessages.map(message => message.id));
				const newMessages = olderMessages.filter(message => !knownIds.has(message.id));
				addedCount = newMessages.length;

				return {
					messages: {
						...state.messages,
						[conversationId]: [...newMessages, ...currentMessages]
					},
					messagesPagination: {
						...state.messagesPagination,
						[conversationId]: {
							hasMore: response.data!.hasMore && Boolean(response.data!.nextCursor),
							isLoading: false,
							...(response.data!.nextCursor && { nextCursor: response.data!.nextCursor })
						}
					}
				};
			});

			return addedCount;
		} catch (error) {
			if (get().workspaceUid !== workspaceUid) return 0;

			set(state => ({
				messagesPagination: {
					...state.messagesPagination,
					[conversationId]: {
						...currentPagination,
						isLoading: false,
						error:
							error instanceof Error
								? error.message
								: 'Não foi possível carregar as mensagens anteriores.'
					}
				}
			}));
			return 0;
		}
	},
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
				preview: '',
				time: 'Agora',
				type: 'all' as const,
				phone: formatNationalPhone(contact.phone) || contact.phone,
				avatarClassName: 'from-brand-500 to-emerald-700',
				tags: contact.tags || [],
				notes: ''
			};

			return {
				activeFilter: 'all',
				contactPanelOpen: false,
				conversations: [conversation, ...state.conversations],
				messages: { ...state.messages, [conversation.id]: [] },
				messagesPagination: {
					...state.messagesPagination,
					[conversation.id]: { hasMore: false, isLoading: false }
				},
				mobileView: 'chat',
				newConversationOpen: false,
				search: '',
				selectedConversationId: conversation.id
			};
		});

		return conversationId;
	},
	sendMessage: async request => {
		try {
			const response = await conversationsAPI.sendMessage(request.workspaceUid, request.conversationId, {
				text: request.text,
				files: request.files
			});

			if (!response.success || !response.data) {
				throw new Error(getResponseMessage(response, 'Não foi possível enviar a mensagem.'));
			}

			const sentMessages = response.data.map((message, index) => {
				const mappedMessage = mapMessage(message);
				const optimisticMessage = request.optimisticMessages[index];

				return {
					...mappedMessage,
					clientId: optimisticMessage?.id,
					requestId: request.requestId,
					...(mappedMessage.type === 'file' &&
						optimisticMessage?.type === 'file' &&
						optimisticMessage.previewUrl && {
							previewUrl: optimisticMessage.previewUrl
						})
				};
			});
			const latestMessage = sentMessages.at(-1);
			const preview = formatMessageSummary(latestMessage);

			set(state => {
				if (state.workspaceUid !== request.workspaceUid) return state;

				const currentMessages = state.messages[request.conversationId] || [];
				const withoutRequest = currentMessages.filter(message => message.requestId !== request.requestId);
				const knownIds = new Set(withoutRequest.map(message => message.id));
				const newMessages = sentMessages.filter(message => !knownIds.has(message.id));
				const currentConversation = state.conversations.find(
					conversation => conversation.id === request.conversationId
				);
				const conversations = currentConversation
					? [
							{
								...currentConversation,
								preview,
								time: latestMessage?.time || currentTime(),
								type:
									currentConversation.type === 'unread' ? ('all' as const) : currentConversation.type,
								unread: undefined
							},
							...state.conversations.filter(conversation => conversation.id !== request.conversationId)
						]
					: state.conversations;

				return {
					conversations,
					messages: {
						...state.messages,
						[request.conversationId]: [...withoutRequest, ...newMessages]
					}
				};
			});

			releaseMessageSendRequest(request);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Não foi possível enviar a mensagem.';
			const failedMessages = request.optimisticMessages.map(message => ({
				...message,
				error: errorMessage,
				status: 'error' as const
			}));

			set(state => {
				if (state.workspaceUid !== request.workspaceUid) {
					releaseMessageSendRequest(request);
					return state;
				}

				return {
					messages: {
						...state.messages,
						[request.conversationId]: [
							...(state.messages[request.conversationId] || []).filter(
								message => message.requestId !== request.requestId
							),
							...failedMessages
						]
					}
				};
			});
		}
	},
	setActiveFilter: activeFilter => set({ activeFilter }),
	setActiveSection: activeSection => set({ activeSection, sidebarOpen: false }),
	setMobileView: mobileView => set({ mobileView }),
	setSearch: search => set({ search })
}));
