import { mainAPI } from '../client';
import type { ServerResponse } from '../types';
import type {
	ConversationMessageData,
	ConversationMessageListData,
	ConversationMessageListOptions
} from './conversations';
import type { IntegrationData } from './integrations';

export interface WidgetStartInput {
	name: string;
	email: string;
}

export interface WidgetStartData {
	integration: IntegrationData;
	token: string;
}

export interface WidgetRecoverData {
	integration: IntegrationData;
	messages: ConversationMessageListData;
	recovered: boolean;
}

export interface WidgetSendInput {
	text: string;
	files: File[];
}

export const widgetAPI = {
	recover: async (integrationId: string, token?: string, signal?: AbortSignal) => {
		const response = await mainAPI.get<ServerResponse<WidgetRecoverData>>(
			`/widget/${encodeURIComponent(integrationId)}/recover`,
			{
				...(token && { headers: { Authorization: `Bearer ${token}` } }),
				signal
			}
		);

		return response.data;
	},

	listMessages: async (
		integrationId: string,
		token: string,
		options?: ConversationMessageListOptions
	) => {
		const response = await mainAPI.get<ServerResponse<ConversationMessageListData>>(
			`/widget/${encodeURIComponent(integrationId)}/messages`,
			{
				headers: { Authorization: `Bearer ${token}` },
				params: {
					cursor: options?.cursor,
					limit: options?.limit
				},
				signal: options?.signal
			}
		);

		return response.data;
	},

	sendMessage: async (integrationId: string, token: string, input: WidgetSendInput) => {
		const form = new FormData();
		const text = input.text.trim();

		if (text) form.append('text', text);
		for (const file of input.files) form.append('files', file, file.name);

		const response = await mainAPI.post<ServerResponse<ConversationMessageData[]>>(
			`/widget/${encodeURIComponent(integrationId)}/send`,
			form,
			{
				headers: { Authorization: `Bearer ${token}` },
				timeout: 120_000
			}
		);

		return response.data;
	},

	start: async (integrationId: string, data: WidgetStartInput) => {
		const response = await mainAPI.post<ServerResponse<WidgetStartData>>(
			`/widget/${encodeURIComponent(integrationId)}/start`,
			data
		);

		return response.data;
	}
};
