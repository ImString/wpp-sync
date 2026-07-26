import type { AuthenticationErrorCode } from './authentication/AuthenticationErrorCode.js';
import type { UserErrorCode } from './user/UserErrorCode.js';

export type ApplicationErrorCode = AuthenticationErrorCode | UserErrorCode;
