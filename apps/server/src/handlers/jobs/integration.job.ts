import { BullJob, BullListener } from '@/modules/index.js';

import { IntegrationService } from '@/services/index.js';

import { IntegrationJobDTO } from '@/entities/dtos/jobs/integration.dto.js';

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
	}

	@BullListener(IntegrationJobDTO.WhatsappCreate)
	async whatsappCreate(data: typeof IntegrationJobDTO.WhatsappCreate.data) {}
}
