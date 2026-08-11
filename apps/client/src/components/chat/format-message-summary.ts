import type { ConversationMessageData } from '@/utils/api';

import type { ChatMessage } from './types';

type MessageSummarySource = ConversationMessageData | ChatMessage;
type MessageSummaryType = 'text' | 'image' | 'audio' | 'video' | 'document' | 'system';

interface NormalizedMessageSummary {
	type?: MessageSummaryType;
	text?: string;
}

const API_MESSAGE_TYPES: Partial<Record<NonNullable<ConversationMessageData['type']>, MessageSummaryType>> = {
	TEXT: 'text',
	IMAGE: 'image',
	AUDIO: 'audio',
	VIDEO: 'video',
	FILE: 'document',
	SYSTEM: 'system'
};

const normalizeMessageSummary = (message: MessageSummarySource): NormalizedMessageSummary => {
	if (message.type === 'text') {
		return {
			type: 'text',
			text: message.text
		};
	}

	if (message.type === 'file') {
		return {
			type: message.fileKind === 'file' || !message.fileKind ? 'document' : message.fileKind
		};
	}

	return {
		type: message.type ? API_MESSAGE_TYPES[message.type] : message.text ? 'text' : undefined,
		text: message.text
	};
};

export const formatMessageSummary = (message?: MessageSummarySource) => {
	if (!message) return '';
	const normalizedMessage = normalizeMessageSummary(message);

	switch (normalizedMessage.type) {
		case 'text':
			return normalizedMessage.text?.trim() || '';
		case 'image':
			return 'Imagem';
		case 'audio':
			return 'Áudio';
		case 'video':
			return 'Vídeo';
		case 'document':
			return 'Documento';
		case 'system':
			return normalizedMessage.text?.trim() || 'Atualização da conversa';
		default:
			return '';
	}
};
