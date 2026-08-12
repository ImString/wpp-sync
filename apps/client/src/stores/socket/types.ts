import type { Socket } from 'socket.io-client';

import type { ConversationData, ConversationMessageData } from '@/utils/api';

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

export interface ConversationNewData {
	conversation: ConversationData;
}

export interface ConversationClosedData {
	conversationId: string;
}

export interface ConversationReceiveMessageData {
	conversation: ConversationData;
	message: ConversationMessageData;
}

export interface ServerToClientEvents {
	'conversation:closed': (data: ConversationClosedData) => void;
	'conversation:new': (data: ConversationNewData) => void;
	'conversation:receiveMessage': (data: ConversationReceiveMessageData) => void;
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
