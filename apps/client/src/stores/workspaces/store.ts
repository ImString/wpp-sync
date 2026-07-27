import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { initialWorkspaces } from './data';
import type { Workspace, WorkspaceStore } from './types';

export const useWorkspaceStore = create<WorkspaceStore>()(
	persist(
		set => ({
			workspaces: initialWorkspaces,
			activeWorkspaceSlug: null,
			createWorkspace: data => {
				const workspace: Workspace = {
					id: `workspace-${Date.now()}`,
					name: data.name,
					slug: data.slug,
					role: 'owner',
					members: 1,
					connectedChannels: 0,
					lastAccess: 'Criada agora',
					active: true,
					logoVariant: 'custom',
					segment: data.segment
				};

				set(state => ({ workspaces: [...state.workspaces, workspace] }));
				return workspace;
			},
			setActiveWorkspace: activeWorkspaceSlug => set({ activeWorkspaceSlug })
		}),
		{
			name: 'WppSyncWorkspaces',
			storage: createJSONStorage(() => localStorage),
			partialize: state => ({
				workspaces: state.workspaces,
				activeWorkspaceSlug: state.activeWorkspaceSlug
			})
		}
	)
);
