import { io } from 'socket.io-client';
import { create } from 'zustand';

import { apiUrl } from '@/utils/api/config';

import { useAuthenticationStore } from '@/stores/auth';

import type { ApplicationSocket, SocketStore } from './types';

const removeSocketListeners = (socket: ApplicationSocket) => {
	socket.removeAllListeners();
	socket.io.removeAllListeners();
};

export const useSocketStore = create<SocketStore>()((set, get) => ({
	connectionState: 'disconnected',
	socket: null,
	workspaceUid: null,

	connect: authToken => {
		const currentSocket = get().socket;

		if (currentSocket) {
			removeSocketListeners(currentSocket);
			currentSocket.disconnect();
		}

		const socket: ApplicationSocket = io(apiUrl, {
			autoConnect: false,
			transports: ['websocket', 'polling'],
			auth: cb => cb({ token: useAuthenticationStore.getState().authToken || authToken })
		});

		socket.on('connect', () => {
			set({ connectionState: 'connected' });

			const workspaceUid = get().workspaceUid;
			if (workspaceUid) socket.emit('workspace:join', { workspaceUID: workspaceUid });
		});

		socket.on('connect_error', () => {
			set({ connectionState: socket.active ? 'connecting' : 'error' });
		});

		socket.on('disconnect', reason => {
			set({ connectionState: reason === 'io client disconnect' ? 'disconnected' : 'connecting' });
		});

		socket.io.on('reconnect_attempt', () => set({ connectionState: 'connecting' }));
		socket.io.on('reconnect_failed', () => set({ connectionState: 'error' }));

		set({ socket, connectionState: 'connecting' });
		socket.connect();
	},

	disconnect: () => {
		const { socket, workspaceUid } = get();

		if (socket?.connected && workspaceUid) socket.emit('workspace:leave');

		if (socket) {
			removeSocketListeners(socket);
			socket.disconnect();
		}

		set({ socket: null, workspaceUid: null, connectionState: 'disconnected' });
	},

	joinWorkspace: workspaceUid => {
		const { socket, workspaceUid: currentWorkspaceUid } = get();

		if (socket?.connected && currentWorkspaceUid && currentWorkspaceUid !== workspaceUid) {
			socket.emit('workspace:leave');
		}

		set({ workspaceUid });

		if (socket?.connected) socket.emit('workspace:join', { workspaceUID: workspaceUid });
	},

	leaveWorkspace: expectedWorkspaceUid => {
		const { socket, workspaceUid } = get();

		if (expectedWorkspaceUid && workspaceUid !== expectedWorkspaceUid) return;
		if (socket?.connected && workspaceUid) socket.emit('workspace:leave');

		set({ workspaceUid: null });
	}
}));
