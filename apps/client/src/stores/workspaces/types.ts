export interface Workspace {
	id: string;
	uid: string;
	name: string;
	slug: string;
	avatarUrl?: string | null;
	disabled?: boolean | null;
	createdAt?: string;
	updatedAt?: string;
	owner?: {
		id: string;
		name?: string;
		email?: string;
		avatarUrl?: string | null;
	};
}

export interface CreateWorkspaceData {
	name: string;
	avatar?: File;
}

export type WorkspaceListStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface WorkspaceStore {
	workspaces: Workspace[];
	total: number;
	listStatus: WorkspaceListStatus;
	error: string | null;
	activeWorkspaceUid: string | null;
	listWorkspaces: (signal?: AbortSignal) => Promise<Workspace[]>;
	getWorkspace: (uid: string, signal?: AbortSignal) => Promise<Workspace>;
	createWorkspace: (data: CreateWorkspaceData) => Promise<Workspace>;
	setActiveWorkspace: (uid: string) => void;
	clearWorkspaces: () => void;
}
