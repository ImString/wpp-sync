import type { AuthenticationErrorCode } from './authentication/AuthenticationErrorCode.js';
import type { UserErrorCode } from './user/UserErrorCode.js';
import type { WorkspaceErrorCode } from './workspace/WorkspaceErrorCode.js';

export type ApplicationErrorCode = AuthenticationErrorCode | UserErrorCode | WorkspaceErrorCode;
