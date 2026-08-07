import { Controller, HttpResponse, Put } from '@/modules/index.js';

import { IntegrationService, WebIntegrationService } from '@/services/index.js';

import { IntegrationDTO } from '@/entities/dtos/integrations/integration.dto.js';
import { WorkspaceNotFoundError } from '@/entities/errors/workspace/WorkspaceNotFoundError.js';

import { AuthenticationMiddleware } from '@/handlers/middlewares/authentication.js';
import { WorkspaceAccessMiddleware } from '@/handlers/middlewares/workspace.js';

@Controller({
	path: '/workspace/:uid/integrations',
	middlewares: [AuthenticationMiddleware, WorkspaceAccessMiddleware]
})
export class IntegrationsWebController {
	constructor(
		private readonly integrationService: IntegrationService,
		private readonly webIntegrationService: WebIntegrationService
	) {}

	@Put('/:dataId/web', IntegrationDTO.WebConfig)
	async webConfig(context: typeof IntegrationDTO.WebConfig.context) {
		const workspace = context.state.workspaceAccess?.workspace;
		if (!workspace) throw new WorkspaceNotFoundError();

		const integration = await this.integrationService.get({
			id: context.params.dataId,
			type: 'WEB',
			include: {
				workspace: true
			},
			workspace: workspace.id
		});

		const form = await IntegrationDTO.WebConfig.toForm({ request: context.request });
		const headerPhoto = form.files.find(file => file.fieldname === 'headerPhoto');

		await this.webIntegrationService.updateConfig(integration, form.fields, headerPhoto);

		return HttpResponse.success(await integration.toObject({}));
	}
}
