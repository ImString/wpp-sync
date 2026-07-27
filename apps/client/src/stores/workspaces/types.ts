export type WorkspaceRole = 'owner' | 'member';

export type WorkspaceLogoVariant = 'brand' | 'aurora' | 'sales' | 'custom';

export interface Workspace {
	id: string;
	name: string;
	slug: string;
	role: WorkspaceRole;
	members: number;
	connectedChannels: number;
	lastAccess: string;
	active?: boolean;
	logoVariant: WorkspaceLogoVariant;
	segment?: string;
}

export interface CreateWorkspaceData {
	name: string;
	slug: string;
	segment: string;
}

export interface WorkspaceStore {
	workspaces: Workspace[];
	activeWorkspaceSlug: string | null;
	createWorkspace: (data: CreateWorkspaceData) => Workspace;
	setActiveWorkspace: (slug: string) => void;
}
