import { Controller, Get, HttpResponse } from '@wppsync/backend';

import { environment } from '@/config/index.js';
import { KafkaModuleBase } from '@/modules/kafka/index.js';
import { WhatsAppModuleBase } from '@/modules/whatsapp/index.js';

@Controller('/health')
export class HealthController {
	constructor(
		private readonly whatsapp: WhatsAppModuleBase,
		private readonly kafka: KafkaModuleBase
	) {}

	@Get()
	async health() {
		return HttpResponse.success({
			service: 'whatsapp-instance',
			instanceId: environment.instanceId,
			status: 'ok',
			whatsapp: this.whatsapp.status,
			kafka: this.kafka.producer ? 'connected' : 'disabled'
		});
	}
}
