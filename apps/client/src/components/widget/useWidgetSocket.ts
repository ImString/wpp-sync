import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

import { apiUrl } from '@/utils/api/config';

export type WidgetSocketConnectionState = 'connected' | 'connecting' | 'disconnected' | 'error';

interface WidgetSocketOptions {
	workspaceUid: string;
	integrationId: string;
}

export const useWidgetSocket = ({ workspaceUid, integrationId }: WidgetSocketOptions) => {
	const [connectionState, setConnectionState] = useState<WidgetSocketConnectionState>('disconnected');

	useEffect(() => {
		if (!workspaceUid || !integrationId) {
			setConnectionState('disconnected');
			return;
		}

		const socket = io(apiUrl, {
			autoConnect: false,
			forceNew: true,
			transports: ['websocket', 'polling'],
			auth: {
				client: 'widget',
				workspaceUid,
				integrationId
			}
		});

		const handleConnect = () => setConnectionState('connected');
		const handleConnectError = () => setConnectionState(socket.active ? 'connecting' : 'error');
		const handleDisconnect = (reason: string) =>
			setConnectionState(reason === 'io client disconnect' ? 'disconnected' : 'connecting');
		const handleReconnectAttempt = () => setConnectionState('connecting');
		const handleReconnectFailed = () => setConnectionState('error');

		socket.on('connect', handleConnect);
		socket.on('connect_error', handleConnectError);
		socket.on('disconnect', handleDisconnect);
		socket.io.on('reconnect_attempt', handleReconnectAttempt);
		socket.io.on('reconnect_failed', handleReconnectFailed);

		setConnectionState('connecting');
		socket.connect();

		return () => {
			socket.off('connect', handleConnect);
			socket.off('connect_error', handleConnectError);
			socket.off('disconnect', handleDisconnect);
			socket.io.off('reconnect_attempt', handleReconnectAttempt);
			socket.io.off('reconnect_failed', handleReconnectFailed);
			socket.disconnect();
		};
	}, [integrationId, workspaceUid]);

	return connectionState;
};
