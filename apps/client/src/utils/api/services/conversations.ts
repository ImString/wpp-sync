import { mainAPI } from '../client';
import type { ServerResponse } from '../types';
import type { IntegrationTypeData } from './integrations';

export type ConversationMessageType = 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO' | 'FILE' | 'SYSTEM';
export type ConversationParticipantType = 'MEMBER' | 'CONTACT' | 'VISITOR';

export interface ConversationContactData {
	id: string;
	name?: string;
	pushName?: string;
	whatsapp?: string;
	email?: string;
	tags?: string[];
}

export interface ConversationParticipantData {
	id: string;
	type?: ConversationParticipantType;
	name?: string;
	email?: string;
	lastReadPosition?: string;
	member?: {
		id: string;
		user?: {
			id: string;
			name?: string;
			email?: string;
			avatarUrl?: string | null;
		};
	};
	contact?: ConversationContactData;
}

export interface ConversationMessageData {
	id: string;
	position?: string;
	type?: ConversationMessageType;
	text?: string;
	payload?: unknown;
	sender?: ConversationParticipantData;
	createdAt?: string;
}

export interface ConversationData {
	id: string;
	name?: string;
	lastActivityAt?: string;
	integration?: {
		id: string;
		name?: string;
		type?: IntegrationTypeData | 'INSTAGRAM' | 'MESSENGER';
	};
	participants?: ConversationParticipantData[];
	messages?: ConversationMessageData[];
	createdAt?: string;
}

export interface ConversationListData {
	items: ConversationData[];
	total: number;
}

export interface ConversationMessageListData {
	items: ConversationMessageData[];
	hasMore: boolean;
	nextCursor?: string;
}

export interface ConversationListOptions {
	page?: number;
	limit?: number;
	search?: string;
	signal?: AbortSignal;
}

export interface ConversationMessageListOptions {
	cursor?: string;
	limit?: number;
	signal?: AbortSignal;
}

export interface ConversationMessageSendOptions {
	text?: string;
	files?: File[];
	signature?: boolean;
}

const workspacePath = (uid: string) => `/workspace/${encodeURIComponent(uid)}/conversations`;

export const conversationsAPI = {
	list: async (uid: string, options?: ConversationListOptions) => {
		const response = await mainAPI.get<ServerResponse<ConversationListData>>(workspacePath(uid), {
			signal: options?.signal,
			params: {
				page: options?.page,
				limit: options?.limit,
				search: options?.search || undefined
			}
		});
		return response.data;
	},

	listMessages: async (uid: string, conversationId: string, options?: ConversationMessageListOptions) => {
		const response = await mainAPI.get<ServerResponse<ConversationMessageListData>>(
			`${workspacePath(uid)}/${encodeURIComponent(conversationId)}/messages`,
			{
				signal: options?.signal,
				params: {
					cursor: options?.cursor,
					limit: options?.limit
				}
			}
		);
		return response.data;
	},

	sendMessage: async (uid: string, conversationId: string, options: ConversationMessageSendOptions) => {
		const form = new FormData();

		if (options.text?.trim()) form.append('text', options.text.trim());
		if (options.signature !== undefined) form.append('signature', JSON.stringify(options.signature));
		for (const file of options.files || []) form.append('files', file, file.name);

		const response = await mainAPI.post<ServerResponse<ConversationMessageData[]>>(
			`${workspacePath(uid)}/${encodeURIComponent(conversationId)}/send`,
			form,
			{ timeout: 120_000 }
		);

		return response.data;
	}
};
