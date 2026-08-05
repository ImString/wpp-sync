import { PermissionsFlags } from '@wppsync/shared';

import { Controller, HttpResponse, Patch } from '@/modules/index.js';

import { WorkspaceService } from '@/services/index.js';

import { WorkspaceTransferDTO } from '@/entities/dtos/workspace/transfer.dto.js';
import { WorkspaceNotFoundError } from '@/entities/errors/workspace/WorkspaceNotFoundError.js';

import { AuthenticationMiddleware } from '@/handlers/middlewares/authentication.js';
import { PermissionMiddleware } from '@/handlers/middlewares/permission.js';
import { WorkspaceAccessMiddleware } from '@/handlers/middlewares/workspace.js';

@Controller({
	path: '/workspace/:uid/transfer',
	middlewares: [
		AuthenticationMiddleware,
		WorkspaceAccessMiddleware,
		PermissionMiddleware.configure({
			permissions: PermissionsFlags.TRANSFER_OWNERSHIP
		})
	]
})
export class WorkspaceTransferController {
	constructor(private readonly workspaceService: WorkspaceService) {}

	@Patch('/', WorkspaceTransferDTO.Index)
	async transfer(context: typeof WorkspaceTransferDTO.Index.context) {
		const { memberId } = context.body;

		const workspace = context.state.workspaceAccess?.workspace;
		if (!workspace) throw new WorkspaceNotFoundError();

		await this.workspaceService.transfer({
			newOwnerId: memberId,
			workspaceId: workspace.id
		});

		return HttpResponse.success();
	}
}
