import type { ContactAlreadyExistsError } from './ContactAlreadyExistsError.js';
import type { ContactNotFoundError } from './ContactNotFoundError.js';
import type { ContactStageNotFoundError } from './ContactStageNotFoundError.js';

export * from './ContactErrorCode.js';
export * from './ContactNotFoundError.js';
export * from './ContactAlreadyExistsError.js';
export * from './ContactStageNotFoundError.js';

export type ContactError = ContactNotFoundError | ContactAlreadyExistsError | ContactStageNotFoundError;
