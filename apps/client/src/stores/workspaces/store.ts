import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { getResponseMessage, workspaceAPI } from '@/utils/api';

import type { Workspace, WorkspaceStore } from './types';

const getErrorMessage = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback);

const upsertWorkspace = (workspaces: Workspace[], workspace: Workspace) => {
	const index = workspaces.findIndex(item => item.uid === workspace.uid);

	if (index === -1) return [workspace, ...workspaces];

	return workspaces.map(item => (item.uid === workspace.uid ? workspace : item));
};

export const useWorkspaceStore = create<WorkspaceStore>()(
	persist(
		set => ({
			workspaces: [],
			total: 0,
			listStatus: 'idle',
			error: null,
			activeWorkspaceUid: null,
			listWorkspaces: async signal => {
				set({ listStatus: 'loading', error: null });

				try {
					const response = await workspaceAPI.list(signal);

					if (!response.success || !response.data) {
						throw new Error(getResponseMessage(response, 'Não foi possível carregar as áreas de trabalho.'));
					}

					set({
						workspaces: response.data.items,
						total: response.data.total,
						listStatus: 'ready',
						error: null
					});

					return response.data.items;
				} catch (error) {
					if (!signal?.aborted) {
						set({
							listStatus: 'error',
							error: getErrorMessage(error, 'Não foi possível carregar as áreas de trabalho.')
						});
					}

					throw error;
				}
			},
			getWorkspace: async (uid, signal) => {
				const response = await workspaceAPI.getByUid(uid, signal);

				if (!response.success || !response.data) {
					throw new Error(getResponseMessage(response, 'Não foi possível carregar a área de trabalho.'));
				}

				set(state => ({
					workspaces: upsertWorkspace(state.workspaces, response.data!),
					activeWorkspaceUid: response.data!.uid
				}));

				return response.data;
			},
			createWorkspace: async data => {
				const form = new FormData();
				form.append('name', data.name);
				if (data.avatar) form.append('avatar', data.avatar);

				const response = await workspaceAPI.create(form);

				if (!response.success || !response.data) {
					throw new Error(getResponseMessage(response, 'Não foi possível criar a área de trabalho.'));
				}

				set(state => ({
					workspaces: upsertWorkspace(state.workspaces, response.data!),
					total: state.workspaces.some(item => item.uid === response.data!.uid)
						? state.total
						: state.total + 1
				}));

				return response.data;
			},
			setActiveWorkspace: activeWorkspaceUid => set({ activeWorkspaceUid }),
			clearWorkspaces: () =>
				set({
					workspaces: [],
					total: 0,
					listStatus: 'idle',
					error: null,
					activeWorkspaceUid: null
				})
		}),
		{
			name: 'WppSyncWorkspaces',
			storage: createJSONStorage(() => localStorage),
			version: 2,
			migrate: () => ({ activeWorkspaceUid: null }),
			partialize: state => ({
				activeWorkspaceUid: state.activeWorkspaceUid
			})
		}
	)
);
