import type { Workspace } from '@/stores/workspaces';

import { mainAPI } from '../client';
import type { ServerResponse } from '../types';

export interface WorkspaceListData {
	items: Workspace[];
	total: number;
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
	}
};
