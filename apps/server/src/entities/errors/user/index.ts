import type { UserEmailAlreadyExistsError } from './UserEmailAlreadyExistsError.js';
import type { UserNotFoundError } from './UserNotFoundError.js';

export * from './UserEmailAlreadyExistsError.js';
export * from './UserErrorCode.js';
export * from './UserNotFoundError.js';

export type UserError = UserEmailAlreadyExistsError | UserNotFoundError;
