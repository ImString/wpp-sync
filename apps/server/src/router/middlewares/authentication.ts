import { Middleware, RouterMiddleware, type RouterMiddlewareContext } from '@/modules/router/index.js';

export interface AuthMiddlewareOptions {
	secretKey: string;
}

@Middleware()
export class AuthenticationMiddleware extends RouterMiddleware {
	static options: AuthMiddlewareOptions;

	constructor() {
		super();
	}

	async execute(context: RouterMiddlewareContext, options: AuthMiddlewareOptions) {}
}
