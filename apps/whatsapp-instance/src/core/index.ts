import { Core } from '@wppsync/backend';
import { access } from 'node:fs/promises';

import { KafkaModule, ServerModule, WhatsAppModule } from '@/modules/modules.js';

const isDockerRuntime = async (): Promise<boolean> => {
	if (process.env.WHATSAPP_INSTANCE_RUNTIME !== 'docker') return false;

	try {
		await access('/.dockerenv');
		return true;
	} catch {
		return false;
	}
};

const init = async () => {
	if (!(await isDockerRuntime())) {
		throw new Error(
			'WhatsApp Instance is Docker-only. Start it from the container image instead of running it on the host.'
		);
	}

	const core = new Core({
		modules: [KafkaModule, WhatsAppModule, ServerModule]
	});

	await core.init();

	const shutdown = async () => {
		await core.shutdown();
		process.exit(0);
	};

	process.once('SIGINT', shutdown);
	process.once('SIGTERM', shutdown);
};

if (import.meta.main) void init();
