import type { AuthenticationErrorCode } from './authentication/AuthenticationErrorCode.js';
import type { InviteErrorCode } from './invite/InviteErrorCode.js';
import type { UserErrorCode } from './user/UserErrorCode.js';
import type { WorkspaceErrorCode } from './workspace/WorkspaceErrorCode.js';

export type ApplicationErrorCode = AuthenticationErrorCode | InviteErrorCode | UserErrorCode | WorkspaceErrorCode;
