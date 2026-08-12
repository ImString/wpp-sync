import { useEffect, useRef, type PropsWithChildren } from 'react';
import { useParams } from 'react-router-dom';

import { useChatStore } from '@/components/chat/store';

import { useSocketStore } from '@/stores';
import type {
	ConversationClosedData,
	ConversationNewData,
	ConversationReceiveMessageData
} from '@/stores/socket/types';

export const WorkspaceSocketMiddleware: React.FC<PropsWithChildren> = props => {
	const { uid } = useParams<{ uid: string }>();
	const socket = useSocketStore(state => state.socket);
	const connectionState = useSocketStore(state => state.connectionState);
	const joinWorkspace = useSocketStore(state => state.joinWorkspace);
	const leaveWorkspace = useSocketStore(state => state.leaveWorkspace);
	const chatWorkspaceUid = useChatStore(state => state.workspaceUid);
	const initializeConversations = useChatStore(state => state.initializeConversations);
	const receiveConversationClosed = useChatStore(state => state.receiveConversationClosed);
	const receiveConversationMessage = useChatStore(state => state.receiveConversationMessage);
	const receiveNewConversation = useChatStore(state => state.receiveNewConversation);
	const previousConnectionStateRef = useRef(connectionState);
	const hasConnectedRef = useRef(connectionState === 'connected');

	useEffect(() => {
		if (!socket || !uid) return;

		const handleNewConversation = (data: ConversationNewData) => {
			if (data?.conversation) receiveNewConversation(uid, data.conversation);
		};
		const handleConversationClosed = (data: ConversationClosedData) => {
			if (data?.conversationId) receiveConversationClosed(uid, data.conversationId);
		};
		const handleReceiveMessage = (data: ConversationReceiveMessageData) => {
			if (data?.conversation && data?.message) {
				receiveConversationMessage(uid, data.conversation, data.message);
			}
		};

		socket.on('conversation:closed', handleConversationClosed);
		socket.on('conversation:new', handleNewConversation);
		socket.on('conversation:receiveMessage', handleReceiveMessage);

		return () => {
			socket.off('conversation:closed', handleConversationClosed);
			socket.off('conversation:new', handleNewConversation);
			socket.off('conversation:receiveMessage', handleReceiveMessage);
		};
	}, [receiveConversationClosed, receiveConversationMessage, receiveNewConversation, socket, uid]);

	useEffect(() => {
		const reconnected =
			connectionState === 'connected' &&
			previousConnectionStateRef.current !== 'connected' &&
			hasConnectedRef.current;

		previousConnectionStateRef.current = connectionState;
		if (connectionState === 'connected') hasConnectedRef.current = true;

		if (reconnected && uid && chatWorkspaceUid === uid) {
			void initializeConversations(uid, true);
		}
	}, [chatWorkspaceUid, connectionState, initializeConversations, uid]);

	useEffect(() => {
		if (!uid) return;

		joinWorkspace(uid);

		return () => leaveWorkspace(uid);
	}, [uid, joinWorkspace, leaveWorkspace]);

	return props.children;
};
