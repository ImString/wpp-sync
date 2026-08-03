import type { WorkspaceErrorCode } from './WorkspaceErrorCode.js';
import type { WorkspaceNotFoundError } from './WorkspaceNotFoundError.js';
import type { InviteNotFoundError } from './invites/InviteNotFoundError.js';
import type { InviteWithSameEmailError } from './invites/InviteWithSameEmailError.js';
import type { MemberNotFoundError } from './members/MemberNotFoundError.js';
import type { PermissionDeniedError } from './PermissionDeniedError.js';

export * from './invites/InviteNotFoundError.js';
export * from './invites/InviteWithSameEmailError.js';

export * from './members/MemberNotFoundError.js';

export * from './PermissionDeniedError.js';
export * from './WorkspaceNotFoundError.js';

export type WorkspaceError =
	| WorkspaceErrorCode
	| WorkspaceNotFoundError
	| PermissionDeniedError
	| MemberNotFoundError
	| InviteNotFoundError
	| InviteWithSameEmailError;
