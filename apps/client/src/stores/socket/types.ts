import type { Socket } from 'socket.io-client';

export type SocketConnectionState = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface JoinWorkspaceData {
	workspaceUID: string;
}

export interface IntegrationUpdateData {
	integrationId: string;
	status?: 'INITIALIZING' | 'AWAITING_LOGIN' | 'CONNECTED' | 'DISCONNECTED';
	name?: string;
	type?: 'WHATSAPP' | 'WEB';
}

export interface ServerToClientEvents {
	'integration:update': (data: IntegrationUpdateData) => void;
}

export interface ClientToServerEvents {
	'workspace:join': (data: JoinWorkspaceData) => void;
	'workspace:leave': () => void;
}

export type ApplicationSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface SocketStore {
	connectionState: SocketConnectionState;
	socket: ApplicationSocket | null;
	workspaceUid: string | null;
	connect: (authToken: string) => void;
	disconnect: () => void;
	joinWorkspace: (workspaceUid: string) => void;
	leaveWorkspace: (expectedWorkspaceUid?: string) => void;
}
