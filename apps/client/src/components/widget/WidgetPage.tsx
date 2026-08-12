import {
	Fragment,
	startTransition,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useOptimistic,
	useRef,
	useState
} from 'react';
import type { FormEvent } from 'react';
import { MdArrowForward, MdAutorenew, MdChatBubbleOutline, MdClose, MdEmail, MdPerson } from 'react-icons/md';
import { useSearchParams } from 'react-router-dom';

import { getResponseMessage, widgetAPI, type ConversationMessageData, type IntegrationData } from '@/utils/api';

import { Button } from '@/components/buttons';
import { MessageComposer } from '@/components/chat/messages/Composer';
import { ChatFileMessage } from '@/components/chat/messages/FileMessage';
import { MessageListSkeleton } from '@/components/chat/messages/Skeleton';
import { MessageStatus } from '@/components/chat/messages/Status';
import type { FileMessage, MessageFileKind, MessageSendInput, TextMessage } from '@/components/chat/types';
import { useInfiniteScroll } from '@/components/infiniteScroll';

import { getWidgetConversationToken, removeWidgetConversationToken, saveWidgetConversationToken } from './storage';
import { useWidgetSocket, type WidgetConversationClosedData, type WidgetReceiveMessageData } from './useWidgetSocket';

type WidgetStage =
	| 'restoring'
	| 'restore-error'
	| 'welcome'
	| 'typing-name'
	| 'name'
	| 'typing-email'
	| 'email'
	| 'typing-chat'
	| 'chat';

type WidgetTextMessage = TextMessage & { createdAt: string; position?: string };
type WidgetFileMessage = FileMessage & { createdAt: string; position?: string };
type WidgetMessage = WidgetTextMessage | WidgetFileMessage;

interface WidgetOptimisticMessageUpdate {
	requestId: string;
	messages: WidgetMessage[];
}

interface WidgetMessagesPagination {
	hasMore: boolean;
	isLoading: boolean;
	nextCursor?: string;
	error?: string;
}

interface WidgetMessageSendRequest extends MessageSendInput {
	requestId: string;
	optimisticMessages: WidgetMessage[];
}

let messageSequence = 0;
const AUTOMATIC_REPLY_DELAY = 3200;
const INVALID_WIDGET_SESSION_CODES = new Set([
	'CONVERSATION_CLOSED',
	'INVALID_TOKEN',
	'CONVERSATION_NOT_FOUND',
	'CONVERSATION_PARTICIPANT_NOT_FOUND'
]);

const optimisticMessageReducer = (messages: WidgetMessage[], update: WidgetOptimisticMessageUpdate) => [
	...messages.filter(message => message.requestId !== update.requestId),
	...update.messages
];

const createRequestId = () => {
	if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
	return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const getSafeMessageDate = (value?: string) => {
	const date = value ? new Date(value) : new Date();
	return Number.isNaN(date.getTime()) ? new Date() : date;
};

const createMessage = (
	direction: WidgetMessage['direction'],
	text: string,
	status: WidgetTextMessage['status'] = direction === 'sent' ? 'sent' : undefined
): WidgetTextMessage => {
	const createdAt = new Date();

	return {
		id: `local-${++messageSequence}`,
		type: 'text',
		direction,
		text,
		time: new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(createdAt),
		createdAt: createdAt.toISOString(),
		...(status && { status })
	};
};

const formatMessageTime = (value?: string) => {
	return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(getSafeMessageDate(value));
};

const getCalendarDateKey = (value: string) => {
	const date = getSafeMessageDate(value);
	return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

const isSameCalendarDate = (left: Date, right: Date) =>
	left.getFullYear() === right.getFullYear() &&
	left.getMonth() === right.getMonth() &&
	left.getDate() === right.getDate();

const formatMessageDate = (value: string, currentDate: Date) => {
	const date = getSafeMessageDate(value);
	if (isSameCalendarDate(date, currentDate)) return 'Hoje';

	const yesterday = new Date(currentDate);
	yesterday.setDate(currentDate.getDate() - 1);
	if (isSameCalendarDate(date, yesterday)) return 'Ontem';

	return new Intl.DateTimeFormat('pt-BR', {
		day: '2-digit',
		month: 'long',
		year: 'numeric'
	}).format(date);
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

const getFileKind = (type: ConversationMessageData['type'], mimeType?: string): MessageFileKind => {
	if (type === 'IMAGE' || mimeType?.startsWith('image/')) return 'image';
	if (type === 'AUDIO' || mimeType?.startsWith('audio/')) return 'audio';
	if (type === 'VIDEO' || mimeType?.startsWith('video/')) return 'video';
	return 'file';
};

const formatFileSize = (size?: number) => {
	if (size === undefined) return '';
	if (size < 1024) return `${size} B`;
	if (size < 1024 * 1024) return `${(size / 1024).toFixed(size < 10 * 1024 ? 1 : 0)} KB`;
	return `${(size / (1024 * 1024)).toFixed(size < 10 * 1024 * 1024 ? 1 : 0)} MB`;
};

const getDefaultFileName = (type: ConversationMessageData['type']) => {
	if (type === 'IMAGE') return 'Imagem';
	if (type === 'AUDIO') return 'Áudio';
	if (type === 'VIDEO') return 'Vídeo';
	return 'Arquivo';
};

const createWidgetMessageSendRequest = (input: MessageSendInput): WidgetMessageSendRequest => {
	const requestId = createRequestId();
	const text = input.text.trim();
	const createdAt = new Date();
	const createdAtISO = createdAt.toISOString();
	const time = formatMessageTime(createdAtISO);
	const optimisticMessages: WidgetMessage[] =
		input.files.length > 0
			? input.files.map<WidgetFileMessage>((file, index) => {
					const mimeType = file.type || 'application/octet-stream';

					return {
						id: `optimistic-${requestId}-${index}`,
						type: 'file',
						direction: 'sent',
						name: file.name,
						details: [mimeType, formatFileSize(file.size)].filter(Boolean).join(' · '),
						...(index === input.files.length - 1 && text && { caption: text }),
						fileKind: getFileKind(undefined, mimeType),
						mimeType,
						...(file.type.startsWith('image/') && { previewUrl: URL.createObjectURL(file) }),
						requestId,
						size: file.size,
						status: 'sending',
						time,
						createdAt: createdAtISO
					};
				})
			: [
					{
						id: `optimistic-${requestId}`,
						type: 'text',
						direction: 'sent',
						text,
						time,
						createdAt: createdAtISO,
						requestId,
						status: 'sending'
					}
				];

	return {
		requestId,
		text,
		files: input.files,
		optimisticMessages
	};
};

const mapConversationMessage = (message: ConversationMessageData): WidgetMessage | undefined => {
	if (typeof message.id !== 'string') return undefined;

	const sent = message.sender?.type === 'VISITOR';
	const createdAt = getSafeMessageDate(message.createdAt);
	const common = {
		id: message.id,
		position: message.position,
		direction: sent ? ('sent' as const) : ('received' as const),
		time: formatMessageTime(message.createdAt),
		createdAt: createdAt.toISOString(),
		...(sent && { status: 'sent' as const })
	};

	if (!message.type || message.type === 'TEXT' || message.type === 'SYSTEM') {
		const text = message.text?.trim() || (message.type === 'SYSTEM' ? 'Atualização da conversa' : '');
		if (!text) return undefined;

		return {
			...common,
			type: 'text',
			text
		};
	}

	const payload = getPayloadRecord(message.payload);
	const mimeType = getPayloadString(payload, ['mimeType', 'mimetype']);
	const size = getPayloadNumber(payload, 'size');
	const details = [mimeType, formatFileSize(size)].filter(Boolean).join(' · ');

	return {
		...common,
		type: 'file',
		name: getPayloadString(payload, ['name', 'filename', 'fileName']) || getDefaultFileName(message.type),
		details: details || getPayloadString(payload, ['type']) || message.type,
		...(message.text?.trim() && { caption: message.text.trim() }),
		fileKind: getFileKind(message.type, mimeType),
		mimeType,
		size,
		url: getPayloadString(payload, ['url'])
	};
};

const mergeConversationMessages = (current: WidgetMessage[], incoming: WidgetMessage[]) => {
	const messagesById = new Map(current.map(item => [item.id, item]));
	for (const item of incoming) messagesById.set(item.id, item);

	return [...messagesById.values()].sort((left, right) => {
		if (left.position && right.position) {
			try {
				const leftPosition = BigInt(left.position);
				const rightPosition = BigInt(right.position);
				if (leftPosition !== rightPosition) return leftPosition < rightPosition ? -1 : 1;
			} catch {}
		}

		return getSafeMessageDate(left.createdAt).getTime() - getSafeMessageDate(right.createdAt).getTime();
	});
};

const getInitials = (value: string) =>
	value
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map(part => part[0]?.toUpperCase())
		.join('') || 'WS';

const getSafePhotoURL = (value?: string | null) => {
	if (!value) return undefined;

	try {
		const url = new URL(value, window.location.origin);
		return ['http:', 'https:'].includes(url.protocol) ? url.toString() : undefined;
	} catch {
		return undefined;
	}
};

export const WidgetPage: React.FC = () => {
	const [searchParams] = useSearchParams();
	const integrationId = searchParams.get('integrationId') || '';
	const workspaceUid = searchParams.get('workspaceUid') || '';
	const mode = searchParams.get('mode') === 'bubble' ? 'bubble' : 'embed';
	const fallbackTitle = searchParams.get('title')?.trim() || 'Atendimento';
	const fallbackPhoto = getSafePhotoURL(searchParams.get('photo'));
	const requestedTheme = searchParams.get('theme');

	const [stage, setStage] = useState<WidgetStage>(() => (integrationId && workspaceUid ? 'restoring' : 'welcome'));
	const [messages, setMessages] = useState<WidgetMessage[]>([]);
	const [messagesPagination, setMessagesPagination] = useState<WidgetMessagesPagination>({
		hasMore: false,
		isLoading: false
	});
	const [widgetIntegration, setWidgetIntegration] = useState<IntegrationData>();
	const [restorationError, setRestorationError] = useState('');
	const [name, setName] = useState('');
	const [nameError, setNameError] = useState('');
	const [email, setEmail] = useState('');
	const [emailError, setEmailError] = useState('');
	const [socketToken, setSocketToken] = useState<string>();
	const [isStarting, setIsStarting] = useState(false);
	const [, setDateRevision] = useState(0);
	const [optimisticMessages, addOptimisticMessages] = useOptimistic(messages, optimisticMessageReducer);
	const messageListRef = useRef<HTMLDivElement>(null);
	const nameInputRef = useRef<HTMLInputElement>(null);
	const emailInputRef = useRef<HTMLInputElement>(null);
	const messageSendRequestsRef = useRef(new Map<string, WidgetMessageSendRequest>());
	const automaticReplyTimerRef = useRef<number>(undefined);
	const activeConversationRef = useRef(false);
	const conversationSessionRevisionRef = useRef(0);
	const pendingOlderScrollRef = useRef<{ scrollHeight: number; scrollTop: number } | undefined>(undefined);
	const previousMessageCountRef = useRef(0);
	const initializedChatScrollRef = useRef(false);
	const nearBottomRef = useRef(true);
	const widgetConfig = widgetIntegration?.id === integrationId ? widgetIntegration.config : undefined;
	const title = widgetConfig?.headerName?.trim() || fallbackTitle;
	const photo = getSafePhotoURL(widgetConfig?.headerPhoto) || fallbackPhoto;
	const initials = useMemo(() => getInitials(title), [title]);
	const isTyping = stage === 'typing-name' || stage === 'typing-email' || stage === 'typing-chat';
	const currentDate = new Date();
	const clearPendingMessageRequests = useCallback(() => {
		for (const request of messageSendRequestsRef.current.values()) {
			for (const message of request.optimisticMessages) {
				if (message.type === 'file' && message.previewUrl) URL.revokeObjectURL(message.previewUrl);
			}
		}
		messageSendRequestsRef.current.clear();
	}, []);
	const resetConversation = useCallback(() => {
		conversationSessionRevisionRef.current += 1;
		activeConversationRef.current = false;

		if (automaticReplyTimerRef.current !== undefined) {
			window.clearTimeout(automaticReplyTimerRef.current);
			automaticReplyTimerRef.current = undefined;
		}

		clearPendingMessageRequests();
		if (integrationId) removeWidgetConversationToken(integrationId);

		setRestorationError('');
		setMessages([]);
		setMessagesPagination({ hasMore: false, isLoading: false });
		setName('');
		setNameError('');
		setEmail('');
		setEmailError('');
		setSocketToken(undefined);
		setIsStarting(false);
		pendingOlderScrollRef.current = undefined;
		previousMessageCountRef.current = 0;
		initializedChatScrollRef.current = false;
		nearBottomRef.current = true;
		setStage('welcome');
	}, [clearPendingMessageRequests, integrationId]);
	const recoverWidget = useCallback(
		async (signal?: AbortSignal) => {
			setRestorationError('');
			setSocketToken(undefined);
			setWidgetIntegration(undefined);
			activeConversationRef.current = false;

			if (!integrationId || !workspaceUid) {
				setStage('welcome');
				return;
			}

			const storedToken = getWidgetConversationToken(integrationId);
			setStage('restoring');

			try {
				const response = await widgetAPI.recover(integrationId, storedToken, signal);
				if (!response.success || !response.data) {
					throw new Error(getResponseMessage(response, 'Não foi possível carregar o atendimento.'));
				}
				if (signal?.aborted) return;

				setWidgetIntegration(response.data.integration);

				if (storedToken && response.data.recovered) {
					const restoredMessages = response.data.messages.items
						.map(mapConversationMessage)
						.filter((item): item is WidgetMessage => item !== undefined);
					setMessages(restoredMessages);
					setMessagesPagination({
						hasMore: response.data.messages.hasMore,
						isLoading: false,
						nextCursor: response.data.messages.nextCursor
					});
					activeConversationRef.current = true;
					setSocketToken(storedToken);
					setStage('chat');
					return;
				}

				resetConversation();
			} catch (error) {
				if (signal?.aborted) return;

				setRestorationError(
					error instanceof Error ? error.message : 'Não foi possível carregar o atendimento.'
				);
				setStage('restore-error');
			}
		},
		[integrationId, resetConversation, workspaceUid]
	);
	const receiveMessage = useCallback((data: WidgetReceiveMessageData) => {
		if (!activeConversationRef.current) return;

		const realtimeMessage = data?.message;
		if (!realtimeMessage) return;

		const receivedMessage = mapConversationMessage(realtimeMessage);
		if (!receivedMessage) return;

		if (automaticReplyTimerRef.current !== undefined) {
			window.clearTimeout(automaticReplyTimerRef.current);
			automaticReplyTimerRef.current = undefined;
		}

		setMessages(current => {
			if (current.some(item => item.id === receivedMessage.id)) return current;

			return [...current, receivedMessage];
		});
		setStage(current => (current === 'typing-chat' ? 'chat' : current));
	}, []);
	const receiveConversationClosed = useCallback(
		(data: WidgetConversationClosedData) => {
			if (!data?.conversationId || !activeConversationRef.current) return;
			resetConversation();
		},
		[resetConversation]
	);

	const { connectionState: socketConnectionState } = useWidgetSocket({
		workspaceUid,
		token: socketToken,
		onConversationClosed: receiveConversationClosed,
		onMessage: receiveMessage
	});
	const loadOlderMessages = useCallback(async () => {
		const area = messageListRef.current;
		if (
			!area ||
			!integrationId ||
			!socketToken ||
			!messagesPagination.hasMore ||
			messagesPagination.isLoading ||
			!messagesPagination.nextCursor
		) {
			return;
		}
		const sessionRevision = conversationSessionRevisionRef.current;

		pendingOlderScrollRef.current = {
			scrollHeight: area.scrollHeight,
			scrollTop: area.scrollTop
		};
		setMessagesPagination(current => ({ ...current, error: undefined, isLoading: true }));

		try {
			const response = await widgetAPI.listMessages(integrationId, socketToken, {
				cursor: messagesPagination.nextCursor,
				limit: 30
			});
			if (sessionRevision !== conversationSessionRevisionRef.current) return;

			if (!response.success || !response.data) {
				if (response.code && INVALID_WIDGET_SESSION_CODES.has(response.code)) {
					resetConversation();
					return;
				}

				throw new Error(getResponseMessage(response, 'Não foi possível carregar mensagens anteriores.'));
			}

			const olderMessages = response.data.items
				.map(mapConversationMessage)
				.filter((item): item is WidgetMessage => item !== undefined);
			if (olderMessages.length === 0) pendingOlderScrollRef.current = undefined;
			setMessages(current => mergeConversationMessages(current, olderMessages));
			setMessagesPagination({
				hasMore: response.data.hasMore,
				isLoading: false,
				nextCursor: response.data.nextCursor
			});
		} catch (error) {
			if (sessionRevision !== conversationSessionRevisionRef.current) return;
			pendingOlderScrollRef.current = undefined;
			setMessagesPagination(current => ({
				...current,
				error: error instanceof Error ? error.message : 'Não foi possível carregar mensagens anteriores.',
				isLoading: false
			}));
		}
	}, [
		integrationId,
		messagesPagination.hasMore,
		messagesPagination.isLoading,
		messagesPagination.nextCursor,
		resetConversation,
		socketToken
	]);
	const { sentinelRef: olderMessagesSentinelRef } = useInfiniteScroll({
		rootRef: messageListRef,
		hasMore: messagesPagination.hasMore,
		isLoading: messagesPagination.isLoading,
		onLoadMore: loadOlderMessages,
		enabled: stage === 'chat',
		rootMargin: '140px 0px 0px'
	});

	useEffect(() => {
		const controller = new AbortController();
		void recoverWidget(controller.signal);

		return () => controller.abort();
	}, [recoverWidget]);

	useEffect(() => {
		if (stage !== 'chat' || socketConnectionState !== 'connected' || !socketToken || !integrationId) return;

		const controller = new AbortController();
		void widgetAPI
			.recover(integrationId, socketToken, controller.signal)
			.then(response => {
				if (controller.signal.aborted) return;

				if (!response.success || !response.data) return;
				setWidgetIntegration(response.data.integration);

				if (!response.data.recovered) {
					resetConversation();
					return;
				}

				const latestMessages = response.data.messages.items
					.map(mapConversationMessage)
					.filter((item): item is WidgetMessage => item !== undefined);
				setMessages(current => mergeConversationMessages(current, latestMessages));
			})
			.catch(() => {});

		return () => controller.abort();
	}, [integrationId, resetConversation, socketConnectionState, socketToken, stage]);

	useEffect(() => {
		const previousDark = document.documentElement.classList.contains('dark');
		const previousLight = document.documentElement.classList.contains('light');
		const media = window.matchMedia('(prefers-color-scheme: dark)');

		const applyTheme = () => {
			const useDark = requestedTheme === 'dark' || (requestedTheme !== 'light' && media.matches);
			document.documentElement.classList.toggle('dark', useDark);
			document.documentElement.classList.toggle('light', !useDark);
		};

		applyTheme();
		media.addEventListener('change', applyTheme);

		return () => {
			media.removeEventListener('change', applyTheme);
			document.documentElement.classList.toggle('dark', previousDark);
			document.documentElement.classList.toggle('light', previousLight);
		};
	}, [requestedTheme]);

	useLayoutEffect(() => {
		const area = messageListRef.current;
		if (!area) return;

		if (stage !== 'chat') {
			initializedChatScrollRef.current = false;
			nearBottomRef.current = true;
			pendingOlderScrollRef.current = undefined;
			previousMessageCountRef.current = optimisticMessages.length;
			if (stage !== 'restoring' && stage !== 'restore-error' && stage !== 'welcome') {
				area.scrollTop = area.scrollHeight;
			}
			return;
		}

		const messageCount = optimisticMessages.length;
		const pendingScroll = pendingOlderScrollRef.current;

		if (!initializedChatScrollRef.current) {
			area.scrollTop = area.scrollHeight;
			initializedChatScrollRef.current = true;
			nearBottomRef.current = true;
		} else if (pendingScroll && messageCount > previousMessageCountRef.current) {
			area.scrollTop = area.scrollHeight - pendingScroll.scrollHeight + pendingScroll.scrollTop;
			pendingOlderScrollRef.current = undefined;
			nearBottomRef.current = false;
		} else if (messageCount > previousMessageCountRef.current && nearBottomRef.current) {
			area.scrollTop = area.scrollHeight;
		}

		previousMessageCountRef.current = messageCount;
	}, [optimisticMessages.length, stage]);

	useEffect(() => {
		let timer: number | undefined;

		const scheduleNextMidnight = () => {
			const now = new Date();
			const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
			const delay = Math.max(1000, nextMidnight.getTime() - now.getTime() + 50);

			timer = window.setTimeout(() => {
				setDateRevision(revision => revision + 1);
				scheduleNextMidnight();
			}, delay);
		};

		scheduleNextMidnight();
		return () => {
			if (timer !== undefined) window.clearTimeout(timer);
		};
	}, []);

	useEffect(() => {
		return () => {
			if (automaticReplyTimerRef.current !== undefined) {
				window.clearTimeout(automaticReplyTimerRef.current);
			}
			clearPendingMessageRequests();
		};
	}, [clearPendingMessageRequests]);

	useEffect(() => {
		if (stage === 'name') nameInputRef.current?.focus();
		if (stage === 'email') emailInputRef.current?.focus();
	}, [stage]);

	const scheduleAutomaticReply = (callback: () => void) => {
		if (automaticReplyTimerRef.current !== undefined) {
			window.clearTimeout(automaticReplyTimerRef.current);
		}

		automaticReplyTimerRef.current = window.setTimeout(() => {
			automaticReplyTimerRef.current = undefined;
			callback();
		}, AUTOMATIC_REPLY_DELAY);
	};

	const startConversation = () => {
		activeConversationRef.current = false;
		conversationSessionRevisionRef.current += 1;
		setMessages([]);
		setMessagesPagination({ hasMore: false, isLoading: false });
		setName('');
		setNameError('');
		setEmail('');
		setEmailError('');
		setSocketToken(undefined);
		setStage('typing-name');
		scheduleAutomaticReply(() => {
			setMessages([createMessage('received', 'Olá! Antes de começarmos, como você gostaria de ser chamado?')]);
			setStage('name');
		});
	};

	const submitName = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const normalizedName = name.trim().replace(/\s+/g, ' ');

		if (!normalizedName) {
			setNameError('Informe como você gostaria de ser chamado.');
			return;
		}
		if (/\p{N}/u.test(normalizedName)) {
			setNameError('O nome não pode conter números.');
			return;
		}

		setName(normalizedName);
		setMessages(current => [...current, createMessage('sent', normalizedName)]);
		setNameError('');
		setStage('typing-email');
		scheduleAutomaticReply(() => {
			setMessages(current => [
				...current,
				createMessage('received', `Prazer, ${normalizedName}! Qual é o seu e-mail?`)
			]);
			setStage('email');
		});
	};

	const submitEmail = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const normalizedEmail = email.trim().toLowerCase();

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
			setEmailError('Informe um e-mail válido para continuar.');
			return;
		}
		if (!integrationId || !workspaceUid) {
			setEmailError('Não foi possível identificar este canal de atendimento.');
			return;
		}

		setIsStarting(true);
		setEmailError('');

		try {
			const response = await widgetAPI.start(integrationId, {
				name,
				email: normalizedEmail
			});

			if (!response.success || !response.data?.token) {
				throw new Error(getResponseMessage(response, 'Não foi possível iniciar a conversa.'));
			}

			setEmail(normalizedEmail);
			setMessages(current => [...current, createMessage('sent', normalizedEmail)]);
			setWidgetIntegration(response.data.integration);
			saveWidgetConversationToken(integrationId, response.data.token);
			activeConversationRef.current = true;
			setSocketToken(response.data.token);
			setStage('typing-chat');
			scheduleAutomaticReply(() => {
				setMessages(current => [
					...current,
					createMessage('received', 'Perfeito! Agora conte como podemos ajudar você.')
				]);
				setStage('chat');
			});
		} catch (error) {
			setEmailError(error instanceof Error ? error.message : 'Não foi possível iniciar a conversa.');
		} finally {
			setIsStarting(false);
		}
	};

	const releaseMessageSendRequest = (request: WidgetMessageSendRequest) => {
		messageSendRequestsRef.current.delete(request.requestId);
		window.setTimeout(
			() => {
				for (const message of request.optimisticMessages) {
					if (message.type === 'file' && message.previewUrl) URL.revokeObjectURL(message.previewUrl);
				}
			},
			5 * 60 * 1000
		);
	};

	const dispatchMessage = (request: WidgetMessageSendRequest) => {
		const sessionRevision = conversationSessionRevisionRef.current;

		startTransition(async () => {
			addOptimisticMessages({
				requestId: request.requestId,
				messages: request.optimisticMessages.map(message => ({
					...message,
					error: undefined,
					status: 'sending'
				}))
			});

			try {
				if (!integrationId || !socketToken) {
					throw new Error('Não foi possível autenticar o envio desta mensagem.');
				}

				const response = await widgetAPI.sendMessage(integrationId, socketToken, {
					text: request.text,
					files: request.files
				});
				if (sessionRevision !== conversationSessionRevisionRef.current) return;
				if (!response.success || !response.data?.length) {
					if (response.code && INVALID_WIDGET_SESSION_CODES.has(response.code)) {
						resetConversation();
						return;
					}
					throw new Error(getResponseMessage(response, 'Não foi possível enviar a mensagem.'));
				}

				const sentMessages: WidgetMessage[] = [];
				response.data.forEach((message, index) => {
					const sentMessage = mapConversationMessage(message);
					const optimisticMessage = request.optimisticMessages[index];
					if (!sentMessage) return;

					sentMessages.push({
						...sentMessage,
						requestId: request.requestId,
						...(sentMessage.type === 'file' &&
							optimisticMessage?.type === 'file' &&
							optimisticMessage.previewUrl && {
								previewUrl: optimisticMessage.previewUrl
							})
					});
				});

				if (sentMessages.length === 0) throw new Error('Não foi possível processar a mensagem enviada.');

				setMessages(current =>
					mergeConversationMessages(
						current.filter(message => message.requestId !== request.requestId),
						sentMessages
					)
				);
				releaseMessageSendRequest(request);
			} catch (error) {
				if (sessionRevision !== conversationSessionRevisionRef.current) return;
				const errorMessage = error instanceof Error ? error.message : 'Não foi possível enviar a mensagem.';
				const failedMessages = request.optimisticMessages.map<WidgetMessage>(message => ({
					...message,
					error: errorMessage,
					status: 'error'
				}));

				setMessages(current => [
					...current.filter(message => message.requestId !== request.requestId),
					...failedMessages
				]);
			}
		});
	};

	const sendMessage = (input: MessageSendInput) => {
		if (!integrationId || !socketToken) return;

		const request = createWidgetMessageSendRequest(input);
		messageSendRequestsRef.current.set(request.requestId, request);
		dispatchMessage(request);
	};

	const retryMessage = (requestId: string) => {
		const request = messageSendRequestsRef.current.get(requestId);
		if (request) dispatchMessage(request);
	};

	const closeWidget = () => {
		if (window.parent === window) return;

		window.parent.postMessage(
			{
				type: 'wppsync:widget-close',
				integrationId
			},
			'*'
		);
	};

	return (
		<main
			className="flex h-dvh min-h-105 w-full min-w-0 bg-white text-slate-900 dark:bg-[#0e181e] dark:text-slate-100"
			data-integration-id={integrationId}
			data-socket-state={socketConnectionState}
			data-workspace-uid={workspaceUid}>
			<section
				aria-label={`Chat com ${title}`}
				className="grid min-h-0 w-full grid-rows-[4.5rem_minmax(0,1fr)_auto] overflow-hidden bg-white dark:bg-[#0e181e]">
				<header className="flex min-w-0 items-center gap-3 border-b border-slate-200 bg-white px-4 dark:border-[#223138] dark:bg-[#0e181e]">
					{stage === 'restoring' ? (
						<>
							<span
								className="size-10 shrink-0 animate-pulse rounded-full bg-slate-200 dark:bg-[#223138]"
								aria-hidden="true"
							/>
							<div className="flex min-w-0 flex-1 animate-pulse flex-col gap-2" aria-hidden="true">
								<span className="h-3.5 w-24 rounded-full bg-slate-200 dark:bg-[#223138]" />
								<span className="h-2.5 w-17 rounded-full bg-slate-100 dark:bg-[#1a292f]" />
							</div>
						</>
					) : photo ? (
						<img className="size-10 rounded-full object-cover" src={photo} alt="" />
					) : (
						<span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
							{initials}
						</span>
					)}

					{stage !== 'restoring' && (
						<div className="min-w-0 flex-1">
							<strong className="block truncate text-sm">{title}</strong>
							<span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-brand-700 dark:text-brand-400">
								<i className="size-1.5 rounded-full bg-brand-500" aria-hidden="true" /> Online agora
							</span>
						</div>
					)}

					{mode === 'bubble' && (
						<Button
							theme="ghost"
							type="button"
							className="icon-button"
							aria-label="Fechar conversa"
							onClick={closeWidget}>
							<MdClose aria-hidden="true" />
						</Button>
					)}
				</header>

				<div
					ref={messageListRef}
					className="widget-chat-pattern flex min-h-0 flex-col overflow-y-auto px-4 py-5 scrollbar-thin"
					aria-live="polite"
					onScroll={event => {
						const area = event.currentTarget;
						nearBottomRef.current = area.scrollHeight - area.scrollTop - area.clientHeight < 80;
					}}>
					{stage === 'restoring' ? (
						<div
							className="flex min-h-full w-full animate-pulse flex-col gap-3 motion-reduce:animate-none"
							role="status"
							aria-label="Carregando atendimento">
							<span
								className="mx-auto h-6 w-18 rounded-full bg-slate-200/90 dark:bg-[#223138]"
								aria-hidden="true"
							/>
							<div
								className="w-[68%] self-start space-y-2 rounded-xl rounded-tl bg-white px-3 py-3 shadow-sm dark:bg-[#18242b]"
								aria-hidden="true">
								<span className="block h-2.5 w-full rounded-full bg-slate-200 dark:bg-[#263841]" />
								<span className="block h-2.5 w-3/5 rounded-full bg-slate-100 dark:bg-[#223138]" />
								<span className="ml-auto block h-1.5 w-8 rounded-full bg-slate-100 dark:bg-[#263841]" />
							</div>
							<div
								className="w-[54%] self-end space-y-2 rounded-xl rounded-tr bg-brand-100/80 px-3 py-3 dark:bg-[#0d5231]/70"
								aria-hidden="true">
								<span className="block h-2.5 w-full rounded-full bg-brand-200/70 dark:bg-[#176b43]" />
								<span className="ml-auto block h-1.5 w-8 rounded-full bg-brand-200/60 dark:bg-[#176b43]" />
							</div>
							<div
								className="w-[61%] self-start space-y-2 rounded-xl rounded-tl bg-white px-3 py-3 shadow-sm dark:bg-[#18242b]"
								aria-hidden="true">
								<span className="block h-2.5 w-4/5 rounded-full bg-slate-200 dark:bg-[#263841]" />
								<span className="ml-auto block h-1.5 w-8 rounded-full bg-slate-100 dark:bg-[#263841]" />
							</div>
						</div>
					) : stage === 'restore-error' ? (
						<div className="m-auto flex max-w-80 flex-col items-center px-4 py-8 text-center" role="alert">
							<MdChatBubbleOutline className="size-8 text-slate-400" aria-hidden="true" />
							<h1 className="mt-3 text-base font-bold">Não foi possível carregar o atendimento</h1>
							<p
								className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400"
								title={restorationError}>
								Confira sua conexão e tente novamente.
							</p>
							<Button type="button" className="mt-5 min-w-36" onClick={() => void recoverWidget()}>
								Tentar novamente
							</Button>
						</div>
					) : stage === 'welcome' ? (
						<div className="m-auto flex max-w-80 flex-col items-center px-4 py-8 text-center">
							<span className="grid size-14 place-items-center rounded-2xl bg-brand-100 text-brand-700 shadow-sm dark:bg-brand-500/15 dark:text-brand-400">
								<MdChatBubbleOutline className="size-7" aria-hidden="true" />
							</span>
							<h1 className="mt-4 text-lg font-bold">Como podemos ajudar?</h1>
							<p className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
								Inicie uma conversa com nossa equipe. Normalmente respondemos em poucos minutos.
							</p>
							<Button type="button" className="mt-5 min-w-44" onClick={startConversation}>
								Iniciar conversa <MdArrowForward className="size-4" aria-hidden="true" />
							</Button>
							<span className="mt-5 text-[9px] font-medium uppercase tracking-[0.14em] text-slate-400">
								Atendimento por WppSync
							</span>
						</div>
					) : (
						<>
							<div className="flex flex-col gap-3">
								<div
									ref={olderMessagesSentinelRef}
									className="flex min-h-1 shrink-0 flex-col"
									aria-live="polite">
									{messagesPagination.isLoading && <MessageListSkeleton count={2} />}
									{messagesPagination.error && !messagesPagination.isLoading && (
										<Button
											theme="ghost"
											type="button"
											className="min-h-8 bg-white/90 px-3 text-xs shadow-sm dark:bg-[#18242b]/90"
											onClick={() => void loadOlderMessages()}>
											Tentar carregar mensagens anteriores
										</Button>
									)}
								</div>

								{optimisticMessages.map((item, index) => {
									const sent = item.direction === 'sent';
									const previousMessage = optimisticMessages[index - 1];
									const showDateSeparator =
										!previousMessage ||
										getCalendarDateKey(previousMessage.createdAt) !==
											getCalendarDateKey(item.createdAt);

									return (
										<Fragment key={item.id}>
											{showDateSeparator && (
												<div className="flex justify-center py-1">
													<span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-medium text-slate-500 shadow-sm dark:border-[#223138] dark:bg-[#0e181e]/90 dark:text-slate-400">
														{formatMessageDate(item.createdAt, currentDate)}
													</span>
												</div>
											)}
											{item.type === 'file' ? (
												<ChatFileMessage
													message={item}
													onRetry={retryMessage}
													onMediaLoad={() => {
														const area = messageListRef.current;
														if (area && nearBottomRef.current)
															area.scrollTop = area.scrollHeight;
													}}
												/>
											) : (
												<article
													className={`${
														sent
															? 'max-w-[84%] self-end rounded-xl rounded-tr bg-[#d9fdd3] px-3 py-2.5 shadow-sm dark:bg-[#0d5231]'
															: 'max-w-[84%] self-start rounded-xl rounded-tl bg-white px-3 py-2.5 shadow-sm dark:bg-[#18242b]'
													}${item.status === 'error' ? ' ring-1 ring-red-500/60' : ''}`}>
													<p className="wrap-break-word text-[13px] leading-5">{item.text}</p>
													<time
														dateTime={item.createdAt}
														className="mt-1 flex items-center justify-end gap-0.5 text-[9px] text-slate-400">
														{item.time}
														{sent && (
															<MessageStatus
																error={item.error}
																requestId={item.requestId}
																status={item.status}
																onRetry={retryMessage}
															/>
														)}
													</time>
												</article>
											)}
										</Fragment>
									);
								})}

								{isTyping && (
									<div
										className="flex w-fit items-center gap-1 self-start rounded-xl rounded-tl bg-white px-3.5 py-3 shadow-sm dark:bg-[#18242b]"
										role="status"
										aria-label="Atendente digitando">
										<span className="widget-typing-dot" aria-hidden="true" />
										<span className="widget-typing-dot" aria-hidden="true" />
										<span className="widget-typing-dot" aria-hidden="true" />
									</div>
								)}
							</div>
						</>
					)}
				</div>

				{stage === 'name' && (
					<form
						className="border-t border-slate-200 bg-white p-3 dark:border-[#223138] dark:bg-[#0e181e]"
						onSubmit={submitName}>
						<label className="sr-only" htmlFor="widget-name">
							Seu nome
						</label>
						<div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5 focus-within:border-brand-500 focus-within:bg-white dark:border-[#223138] dark:bg-[#131f26] dark:focus-within:bg-[#0e181e]">
							<MdPerson className="ml-2 size-5 text-slate-400" aria-hidden="true" />
							<input
								ref={nameInputRef}
								id="widget-name"
								type="text"
								value={name}
								placeholder="Como podemos chamar você?"
								autoComplete="name"
								maxLength={100}
								className="h-10 min-w-0 bg-transparent px-1 text-sm outline-none placeholder:text-slate-400"
								onChange={event => {
									const value = event.target.value;
									setName(value);
									setNameError(/\p{N}/u.test(value) ? 'O nome não pode conter números.' : '');
								}}
							/>
							<Button
								type="submit"
								className="size-10 min-h-10 rounded-lg p-0"
								aria-label="Confirmar nome">
								<MdArrowForward className="size-5" aria-hidden="true" />
							</Button>
						</div>
						{nameError && (
							<p className="mt-2 px-1 text-xs font-medium text-red-600 dark:text-red-400">{nameError}</p>
						)}
					</form>
				)}

				{stage === 'email' && (
					<form
						className="border-t border-slate-200 bg-white p-3 dark:border-[#223138] dark:bg-[#0e181e]"
						onSubmit={submitEmail}>
						<label className="sr-only" htmlFor="widget-email">
							Seu e-mail
						</label>
						<div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5 focus-within:border-brand-500 focus-within:bg-white dark:border-[#223138] dark:bg-[#131f26] dark:focus-within:bg-[#0e181e]">
							<MdEmail className="ml-2 size-5 text-slate-400" aria-hidden="true" />
							<input
								ref={emailInputRef}
								id="widget-email"
								type="email"
								value={email}
								placeholder="voce@exemplo.com"
								autoComplete="email"
								disabled={isStarting}
								className="h-10 min-w-0 bg-transparent px-1 text-sm outline-none placeholder:text-slate-400"
								onChange={event => {
									setEmail(event.target.value);
									setEmailError('');
								}}
							/>
							<Button
								type="submit"
								className="size-10 min-h-10 rounded-lg p-0"
								disabled={isStarting}
								aria-busy={isStarting}
								aria-label="Confirmar e-mail">
								{isStarting ? (
									<MdAutorenew className="size-5 animate-spin" aria-hidden="true" />
								) : (
									<MdArrowForward className="size-5" aria-hidden="true" />
								)}
							</Button>
						</div>
						{emailError && (
							<p className="mt-2 px-1 text-xs font-medium text-red-600 dark:text-red-400">{emailError}</p>
						)}
					</form>
				)}

				{stage === 'chat' && <MessageComposer disabled={!integrationId || !socketToken} onSend={sendMessage} />}
			</section>
		</main>
	);
};
