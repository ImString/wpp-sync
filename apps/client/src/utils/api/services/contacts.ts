import type { StageIconName } from '@wppsync/shared/contact-stages';

import { mainAPI } from '../client';
import type { ServerResponse } from '../types';

export interface ContactStageData {
	id: string;
	name: string;
	slug: string;
	position?: number;
	color: string;
	icon: StageIconName;
	description?: string;
	contactCount?: number;
	createdAt?: string;
}

export interface ContactData {
	id: string;
	name?: string;
	pushName?: string;
	whatsapp: string;
	email?: string;
	tags?: string[];
	notes?: string;
	stageId?: string | null;
	stage?: ContactStageData;
	createdAt?: string;
}

export interface ContactListData {
	items: ContactData[];
	total: number;
}

export interface ContactStageListData {
	items: ContactStageData[];
	total: number;
	contactsTotal: number;
}

export type ContactOrder = 'recent' | 'name';

export interface ContactListOptions {
	page?: number;
	limit?: number;
	search?: string;
	stage?: string;
	order?: ContactOrder;
	signal?: AbortSignal;
}

export interface ContactPayload {
	name: string;
	whatsapp: string;
	email?: string | null;
	stage?: string | null;
	tags?: string[];
	notes?: string;
}

export interface ContactStagePayload {
	name: string;
	color: string;
	icon: StageIconName;
	description?: string | null;
}

const workspacePath = (uid: string) => `/workspace/${encodeURIComponent(uid)}`;

export const contactsAPI = {
	list: async (uid: string, options?: ContactListOptions) => {
		const response = await mainAPI.get<ServerResponse<ContactListData>>(`${workspacePath(uid)}/contacts`, {
			signal: options?.signal,
			params: {
				page: options?.page,
				limit: options?.limit,
				search: options?.search || undefined,
				stage: options?.stage || undefined,
				order: options?.order || undefined
			}
		});
		return response.data;
	},

	get: async (uid: string, contactId: string, signal?: AbortSignal) => {
		const response = await mainAPI.get<ServerResponse<ContactData>>(
			`${workspacePath(uid)}/contacts/${encodeURIComponent(contactId)}`,
			{ signal }
		);
		return response.data;
	},

	create: async (uid: string, data: ContactPayload) => {
		const response = await mainAPI.post<ServerResponse<ContactData>>(`${workspacePath(uid)}/contacts/create`, data);
		return response.data;
	},

	update: async (uid: string, contactId: string, data: Partial<ContactPayload>) => {
		const response = await mainAPI.put<ServerResponse>(
			`${workspacePath(uid)}/contacts/${encodeURIComponent(contactId)}/update`,
			data
		);
		return response.data;
	},

	delete: async (uid: string, contactId: string) => {
		const response = await mainAPI.delete<ServerResponse>(
			`${workspacePath(uid)}/contacts/${encodeURIComponent(contactId)}/delete`
		);
		return response.data;
	},

	listStages: async (uid: string, signal?: AbortSignal) => {
		const response = await mainAPI.get<ServerResponse<ContactStageListData>>(
			`${workspacePath(uid)}/contact-stages`,
			{ signal }
		);
		return response.data;
	},

	createStage: async (uid: string, data: ContactStagePayload) => {
		const response = await mainAPI.post<ServerResponse<ContactStageData>>(
			`${workspacePath(uid)}/contact-stages/create`,
			data
		);
		return response.data;
	},

	updateStage: async (uid: string, stageId: string, data: Partial<ContactStagePayload>) => {
		const response = await mainAPI.put<ServerResponse<ContactStageData>>(
			`${workspacePath(uid)}/contact-stages/${encodeURIComponent(stageId)}/update`,
			data
		);
		return response.data;
	},

	reorderStages: async (uid: string, stageIds: string[]) => {
		const response = await mainAPI.put<ServerResponse>(`${workspacePath(uid)}/contact-stages/reorder`, {
			stageIds
		});
		return response.data;
	},

	deleteStage: async (uid: string, stageId: string, replacementStageId?: string) => {
		const response = await mainAPI.delete<ServerResponse>(
			`${workspacePath(uid)}/contact-stages/${encodeURIComponent(stageId)}/delete`,
			{ data: replacementStageId ? { replacementStageId } : {} }
		);
		return response.data;
	}
};
