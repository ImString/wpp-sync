import { Controller } from '@/modules/index.js';

import { AuthenticationMiddleware } from '@/handlers/middlewares/authentication.js';
import { WorkspaceAccessMiddleware } from '@/handlers/middlewares/workspace.js';

@Controller({
	path: '/workspace/:uid/invites',
	middlewares: [AuthenticationMiddleware, WorkspaceAccessMiddleware]
})
export class WorkspaceInvitesController {}
