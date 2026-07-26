import 'reflect-metadata';

const init = async () => {
	const core = new (await import('./Core.js')).Core();

	core.init();
};

init();
