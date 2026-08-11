import { startTransition, useOptimistic, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';

import { createMessageSendRequest, getMessageSendRequest, useChatStore } from '../store';
import type { ChatMessage, MessageSendInput, MessageSendRequest } from '../types';
import { MessageComposer } from './Composer';
import { ChatHeader } from './Header';
import { MessageList } from './List';

interface OptimisticMessageUpdate {
	requestId: string;
	messages: ChatMessage[];
}

interface ForceMessageScrollRequest {
	requestId: string;
	token: number;
}

const EMPTY_MESSAGES: ChatMessage[] = [];

const optimisticMessageReducer = (messages: ChatMessage[], update: OptimisticMessageUpdate) => {
	return [...messages.filter(message => message.requestId !== update.requestId), ...update.messages];
};

const ConversationMessages: React.FC<{ conversationId: string }> = ({ conversationId }) => {
	const { uid } = useParams<{ uid: string }>();
	const { messages, sendMessage } = useChatStore(
		useShallow(state => ({
			messages: state.messages[conversationId] || EMPTY_MESSAGES,
			sendMessage: state.sendMessage
		}))
	);
	const [optimisticMessages, addOptimisticMessages] = useOptimistic(messages, optimisticMessageReducer);
	const [forceScrollRequest, setForceScrollRequest] = useState<ForceMessageScrollRequest>();

	const dispatchRequest = (request: MessageSendRequest) => {
		setForceScrollRequest({
			requestId: request.requestId,
			token: Date.now() + Math.random()
		});

		startTransition(async () => {
			addOptimisticMessages({
				requestId: request.requestId,
				messages: request.optimisticMessages
			});
			await sendMessage(request);
		});
	};

	const handleSend = (input: MessageSendInput) => {
		if (!uid || !conversationId) return;
		dispatchRequest(createMessageSendRequest(uid, conversationId, input));
	};

	const handleRetry = (requestId: string) => {
		const request = getMessageSendRequest(requestId);
		if (request) dispatchRequest(request);
	};

	return (
		<>
			<MessageList messages={optimisticMessages} onRetry={handleRetry} forceScrollRequest={forceScrollRequest} />
			<MessageComposer disabled={!uid || !conversationId} onSend={handleSend} />
		</>
	);
};

export const ChatPanel: React.FC = () => {
	const selectedConversationId = useChatStore(state => state.selectedConversationId);

	return (
		<section className="chat-panel mobile-screen grid min-h-0 grid-rows-[74px_minmax(0,1fr)_auto] overflow-hidden border-r border-slate-200 bg-white dark:border-[#223138] dark:bg-[#0e181e]">
			<ChatHeader />
			<ConversationMessages key={selectedConversationId} conversationId={selectedConversationId} />
		</section>
	);
};
