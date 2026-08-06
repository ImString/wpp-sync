import { Provider } from '@/core/index.js';

import { SocketRooms } from '@/modules/index.js';
import { BullModule, SocketModule } from '@/modules/modules.js';

import { WorkspaceService } from '../workspace/WorkspaceService.js';

import { IntegrationEntity } from '@/entities/data/index.js';
import { IntegrationJobDTO } from '@/entities/dtos/jobs/integration.dto.js';

@Provider()
export class WebIntegrationService {
	constructor(private readonly workspaceService: WorkspaceService) {}

	async initializing(integration: IntegrationEntity) {
		BullModule.add(IntegrationJobDTO.WebCreate, {
			integrationId: integration.id
		});
	}
}
