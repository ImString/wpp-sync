import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

import type { ConversationData, ConversationMessageData } from '@/utils/api';
import { apiUrl } from '@/utils/api/config';

export type WidgetSocketConnectionState = 'connected' | 'connecting' | 'disconnected' | 'error';

interface WidgetSocketOptions {
	workspaceUid: string;
	token?: string;
	onConversationClosed: (data: WidgetConversationClosedData) => void;
	onMessage: (data: WidgetReceiveMessageData) => void;
}

export interface WidgetConversationClosedData {
	conversationId: string;
}

export interface WidgetReceiveMessageData {
	conversation: ConversationData;
	message: ConversationMessageData;
}

export const useWidgetSocket = ({ workspaceUid, token, onConversationClosed, onMessage }: WidgetSocketOptions) => {
	const [connectionState, setConnectionState] = useState<WidgetSocketConnectionState>('disconnected');
	const onConversationClosedRef = useRef(onConversationClosed);
	const onMessageRef = useRef(onMessage);

	useEffect(() => {
		onConversationClosedRef.current = onConversationClosed;
	}, [onConversationClosed]);

	useEffect(() => {
		onMessageRef.current = onMessage;
	}, [onMessage]);

	useEffect(() => {
		if (!workspaceUid || !token) {
			setConnectionState('disconnected');
			return;
		}

		const socket = io(apiUrl, {
			autoConnect: false,
			forceNew: true,
			transports: ['websocket', 'polling'],
			auth: {
				token
			}
		});

		const handleConnect = () => {
			setConnectionState('connected');
			socket.emit('conversation:join', { workspaceUID: workspaceUid });
		};

		const handleConnectError = () => setConnectionState(socket.active ? 'connecting' : 'error');
		const handleDisconnect = (reason: string) =>
			setConnectionState(reason === 'io client disconnect' ? 'disconnected' : 'connecting');
		const handleReconnectAttempt = () => setConnectionState('connecting');
		const handleReconnectFailed = () => setConnectionState('error');
		const handleConversationClosed = (data: WidgetConversationClosedData) =>
			onConversationClosedRef.current(data);
		const handleMessage = (data: WidgetReceiveMessageData) => onMessageRef.current(data);

		socket.on('connect', handleConnect);
		socket.on('connect_error', handleConnectError);
		socket.on('disconnect', handleDisconnect);
		socket.on('conversation:closed', handleConversationClosed);
		socket.on('conversation:receiveMessage', handleMessage);
		socket.io.on('reconnect_attempt', handleReconnectAttempt);
		socket.io.on('reconnect_failed', handleReconnectFailed);

		setConnectionState('connecting');
		socket.connect();

		return () => {
			if (socket.connected) socket.emit('conversation:leave', {});
			socket.off('connect', handleConnect);
			socket.off('connect_error', handleConnectError);
			socket.off('disconnect', handleDisconnect);
			socket.off('conversation:closed', handleConversationClosed);
			socket.off('conversation:receiveMessage', handleMessage);
			socket.io.off('reconnect_attempt', handleReconnectAttempt);
			socket.io.off('reconnect_failed', handleReconnectFailed);
			socket.disconnect();
		};
	}, [token, workspaceUid]);

	return { connectionState };
};
