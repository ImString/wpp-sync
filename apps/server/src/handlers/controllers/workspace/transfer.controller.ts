import { PermissionsFlags } from '@wppsync/shared';

import { Controller, HttpResponse, Patch, type RouterMiddlewareContext } from '@/modules/index.js';

import { WorkspaceService } from '@/services/index.js';

import { WorkspaceTransferDTO } from '@/entities/dtos/workspace/transfer.dto.js';

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
	async transfer(context: RouterMiddlewareContext) {
		const { memberId } = context.body;

		await this.workspaceService.transfer({
			newOwnerId: memberId,
			workspaceId: context.params.uid
		});

		return HttpResponse.success();
	}
}
