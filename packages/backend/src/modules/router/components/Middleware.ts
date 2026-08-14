import type {
	MountedMiddleware,
	RouterMiddlewareClass,
	RouterMiddlewareContext
} from '@/modules/router/types/index.js';

export class RouterMiddleware {
	static options: any;

	static configure<TConfigure extends (typeof RouterMiddleware)['options']>(
		this: RouterMiddlewareClass & { options: TConfigure },
		options: TConfigure
	): MountedMiddleware<TConfigure> {
		return {
			constructor: this,
			options
		};
	}

	async execute(context: RouterMiddlewareContext, options: any): Promise<any> {}
}

export default { RouterMiddleware };
