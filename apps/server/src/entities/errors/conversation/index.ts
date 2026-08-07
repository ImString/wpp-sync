import type { ConversationParticipantCreationError } from './ConversationParticipantCreationError.js';
import type { InvalidConversationParticipantError } from './InvalidConversationParticipantError.js';

export * from './ConversationErrorCode.js';
export * from './ConversationParticipantCreationError.js';
export * from './InvalidConversationParticipantError.js';

export type ConversationError =
	| InvalidConversationParticipantError
	| ConversationParticipantCreationError;
