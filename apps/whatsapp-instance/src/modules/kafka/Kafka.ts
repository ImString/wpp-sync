import { BaseModule, type Core } from '@wppsync/backend';
import { Terminal } from '@wppsync/shared';
import type { WhatsAppEvent, WhatsAppEventTopic } from '@wppsync/whatsapp-contracts';
import { Kafka, logLevel, type Producer } from 'kafkajs';
import { randomUUID } from 'node:crypto';

import { environment } from '@/config/index.js';

export class KafkaModuleBase extends BaseModule {
	producer?: Producer;

	async init(core: Core): Promise<void> {
		core.providers.registerInstance(KafkaModuleBase, this);

		if (environment.kafka.brokers.length === 0) {
			Terminal.info('KAFKA', 'No broker configured; event publishing is disabled.');
			return;
		}

		const kafka = new Kafka({
			clientId: `${environment.kafka.clientId}-${environment.instanceId}`,
			brokers: [...environment.kafka.brokers],
			logLevel: logLevel.NOTHING
		});

		this.producer = kafka.producer({
			allowAutoTopicCreation: false,
			idempotent: true,
			maxInFlightRequests: 1
		});

		await this.producer.connect();
		Terminal.success('KAFKA', 'Producer connected.');
	}

	async publish<TData>(topic: WhatsAppEventTopic, data: TData): Promise<boolean> {
		if (!this.producer) return false;

		const event: WhatsAppEvent<TData> = {
			eventId: randomUUID(),
			instanceId: environment.instanceId,
			occurredAt: new Date().toISOString(),
			data
		};

		await this.producer.send({
			topic,
			messages: [
				{
					key: environment.instanceId,
					value: JSON.stringify(event, (_key, value) =>
						typeof value === 'bigint' ? value.toString() : value
					)
				}
			]
		});

		return true;
	}

	async shutdown(): Promise<void> {
		await this.producer?.disconnect();
		this.producer = undefined;
	}
}

export const KafkaModule = new KafkaModuleBase();
