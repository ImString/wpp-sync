import { Provider } from '@/core/index.js';

import { IntegrationEntity } from '@/entities/data/index.js';

@Provider()
export class WhatsAppIntegrationService {
	async initializing(integration: IntegrationEntity) {}
}
