import { Core } from '@wppsync/backend';

import { BullModule, RedisModule, ServerModule, SocketModule } from '../modules/modules.js';

export * from '@wppsync/backend';

const init = async () => {
	const core = new Core({
		modules: [BullModule, RedisModule, ServerModule, SocketModule]
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
