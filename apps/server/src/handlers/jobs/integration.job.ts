import { BullJob, BullListener, SocketModule, SocketRooms } from '@/modules/index.js';

import { IntegrationService } from '@/services/index.js';

import { IntegrationJobDTO } from '@/entities/dtos/jobs/integration.dto.js';
import { IntegrationSocketDTO } from '@/entities/dtos/sockets/integration.dto.js';

@BullJob()
export class IntegrationJob {
	constructor(private readonly integrationService: IntegrationService) {}

	@BullListener(IntegrationJobDTO.WebCreate)
	async webCreate(data: typeof IntegrationJobDTO.WebCreate.data) {
		const { integrationId } = data;

		const integration = await this.integrationService
			.get({ id: integrationId, include: { workspace: true } })
			.catch(() => null);
		if (!integration) return;

		await this.integrationService.update(integration, {
			status: 'AWAITING_LOGIN'
		});

		if (integration.entities.workspace?.data.uid) {
			SocketModule.emitTo(
				SocketRooms.workspace(integration.entities.workspace.data.uid),
				IntegrationSocketDTO.Update,
				{
					integrationId: integration.id,
					status: 'AWAITING_LOGIN'
				}
			);
		}
	}

	@BullListener(IntegrationJobDTO.WhatsappCreate)
	async whatsappCreate(data: typeof IntegrationJobDTO.WhatsappCreate.data) {}
}
