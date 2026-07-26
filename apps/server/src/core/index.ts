import 'reflect-metadata';

export * from './Core.js';
export * from './decorators/index.js';
export * from './services/index.js';

const init = async () => {
	const core = new (await import('./Core.js')).Core();

	await core.init();
};

if (import.meta.main) void init();
