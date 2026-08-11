import type { ConversationClosedError } from './ConversationClosedError.js';
import type { ConversationNotFoundError } from './ConversationNotFoundError.js';
import type { ConversationParticipantNotFoundError } from './ConversationParticipantNotFoundError.js';
import type { ConversationParticipantCreationError } from './ConversationParticipantCreationError.js';
import type { InvalidConversationParticipantError } from './InvalidConversationParticipantError.js';
import type { InvalidMessageError } from './InvalidMessageError.js';
import type { MessageNotFoundError } from './MessageNotFoundError.js';

export * from './ConversationErrorCode.js';
export * from './ConversationClosedError.js';
export * from './ConversationNotFoundError.js';
export * from './ConversationParticipantNotFoundError.js';
export * from './ConversationParticipantCreationError.js';
export * from './InvalidConversationParticipantError.js';
export * from './InvalidMessageError.js';
export * from './MessageNotFoundError.js';

export type ConversationError =
	| ConversationClosedError
	| ConversationNotFoundError
	| ConversationParticipantNotFoundError
	| ConversationParticipantCreationError
	| InvalidConversationParticipantError
	| InvalidMessageError
	| MessageNotFoundError;
