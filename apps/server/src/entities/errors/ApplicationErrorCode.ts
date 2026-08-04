import type { AuthenticationErrorCode } from './authentication/AuthenticationErrorCode.js';
import type { ContactErrorCode } from './contact/ContactErrorCode.js';
import type { InviteErrorCode } from './invite/InviteErrorCode.js';
import type { UserErrorCode } from './user/UserErrorCode.js';
import type { WorkspaceErrorCode } from './workspace/WorkspaceErrorCode.js';

export type ApplicationErrorCode =
	| AuthenticationErrorCode
	| ContactErrorCode
	| InviteErrorCode
	| UserErrorCode
	| WorkspaceErrorCode;
