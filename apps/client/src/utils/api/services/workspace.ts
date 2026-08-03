import type { Workspace } from '@/stores/workspaces';

import { mainAPI } from '../client';
import type { ServerResponse } from '../types';

export interface WorkspaceListData {
	items: Workspace[];
	total: number;
}

export type WorkspaceAccessRole = 'ADMIN' | 'MEMBER';
export type WorkspaceMemberRole = WorkspaceAccessRole | 'OWNER';

export interface WorkspaceMember {
	id: string;
	role?: WorkspaceMemberRole;
	disabled?: boolean;
	user?: {
		id: string;
		name?: string;
		email?: string;
		avatarUrl?: string | null;
	};
}

export interface WorkspaceMemberListData {
	items: WorkspaceMember[];
	total: number;
}

export interface WorkspaceInvite {
	id: string;
	email?: string;
	role?: WorkspaceAccessRole;
	createdAt?: string;
	author?: {
		id: string;
		name?: string;
		email?: string;
		avatarUrl?: string | null;
	};
	workspace?: Workspace;
}

export interface WorkspaceInviteListData {
	items: WorkspaceInvite[];
	total: number;
}

export interface CreateWorkspaceInviteData {
	email: string;
	role: WorkspaceAccessRole;
}

export const workspaceAPI = {
	list: async (signal?: AbortSignal) => {
		const response = await mainAPI.get<ServerResponse<WorkspaceListData>>('/workspace/list', { signal });
		return response.data;
	},

	getByUid: async (uid: string, signal?: AbortSignal) => {
		const response = await mainAPI.get<ServerResponse<Workspace>>(`/workspace/${encodeURIComponent(uid)}`, {
			signal
		});
		return response.data;
	},

	create: async (data: FormData) => {
		const response = await mainAPI.post<ServerResponse<Workspace>>('/workspace/create', data);
		return response.data;
	},

	listMembers: async (uid: string, signal?: AbortSignal, search?: string) => {
		const response = await mainAPI.get<ServerResponse<WorkspaceMemberListData>>(
			`/workspace/${encodeURIComponent(uid)}/members`,
			{
				signal,
				params: search ? { name: search } : undefined
			}
		);
		return response.data;
	},

	listReceivedInvites: async (signal?: AbortSignal, workspaceName?: string) => {
		const response = await mainAPI.get<ServerResponse<WorkspaceInviteListData>>('/invites/pending', {
			signal,
			params: workspaceName ? { name: workspaceName } : undefined
		});
		return response.data;
	},

	listPendingInvites: async (uid: string, signal?: AbortSignal) => {
		const response = await mainAPI.get<ServerResponse<WorkspaceInviteListData>>(
			`/workspace/${encodeURIComponent(uid)}/invites`,
			{ signal }
		);
		return response.data;
	},

	createInvite: async (uid: string, data: CreateWorkspaceInviteData) => {
		const response = await mainAPI.post<ServerResponse<WorkspaceInvite>>(
			`/workspace/${encodeURIComponent(uid)}/invites/create`,
			data
		);
		return response.data;
	},

	revokeInvite: async (uid: string, inviteId: string) => {
		const response = await mainAPI.delete<ServerResponse>(
			`/workspace/${encodeURIComponent(uid)}/invites/${encodeURIComponent(inviteId)}/revoke`
		);
		return response.data;
	}
};
