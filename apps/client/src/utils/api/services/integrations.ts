import { mainAPI } from '../client';
import type { ServerResponse } from '../types';

export type IntegrationTypeData = 'WHATSAPP' | 'WEB';
export type IntegrationStatusData = 'INITIALIZING' | 'AWAITING_LOGIN' | 'CONNECTED' | 'DISCONNECTED';

export interface IntegrationWebConfig {
	headerName?: string;
	headerPhoto?: string | null;
}

export interface IntegrationData {
	id: string;
	name: string;
	type: IntegrationTypeData;
	status: IntegrationStatusData;
	config?: IntegrationWebConfig | null;
}

export interface IntegrationListData {
	items: IntegrationData[];
	total: number;
}

export interface IntegrationCountData {
	total: number;
	byStatus: Record<IntegrationStatusData, number>;
}

export interface IntegrationListOptions {
	page?: number;
	limit?: number;
	search?: string;
	status?: IntegrationStatusData;
	signal?: AbortSignal;
}

export interface CreateIntegrationData {
	name: string;
	type: IntegrationTypeData;
}

const workspacePath = (uid: string) => `/workspace/${encodeURIComponent(uid)}/integrations`;

export const integrationsAPI = {
	list: async (uid: string, options?: IntegrationListOptions) => {
		const response = await mainAPI.get<ServerResponse<IntegrationListData>>(`${workspacePath(uid)}`, {
			signal: options?.signal,
			params: {
				page: options?.page,
				limit: options?.limit,
				search: options?.search || undefined,
				status: options?.status
			}
		});
		return response.data;
	},

	allCount: async (uid: string, signal?: AbortSignal) => {
		const response = await mainAPI.get<ServerResponse<IntegrationCountData>>(`${workspacePath(uid)}/all-count`, {
			signal
		});
		return response.data;
	},

	get: async (uid: string, integrationId: string, signal?: AbortSignal) => {
		const response = await mainAPI.get<ServerResponse<IntegrationData>>(
			`${workspacePath(uid)}/${encodeURIComponent(integrationId)}`,
			{ signal }
		);
		return response.data;
	},

	create: async (uid: string, data: CreateIntegrationData) => {
		const response = await mainAPI.post<ServerResponse<IntegrationData>>(`${workspacePath(uid)}/create`, data);
		return response.data;
	},

	update: async (uid: string, integrationId: string, data: { name: string }) => {
		const response = await mainAPI.put<ServerResponse>(
			`${workspacePath(uid)}/${encodeURIComponent(integrationId)}/update`,
			data
		);
		return response.data;
	},

	updateWebConfig: async (uid: string, integrationId: string, data: FormData) => {
		const response = await mainAPI.put<ServerResponse<IntegrationData>>(
			`${workspacePath(uid)}/${encodeURIComponent(integrationId)}/web`,
			data
		);
		return response.data;
	},

	delete: async (uid: string, integrationId: string) => {
		const response = await mainAPI.delete<ServerResponse>(
			`${workspacePath(uid)}/${encodeURIComponent(integrationId)}/delete`
		);
		return response.data;
	}
};
