import { Inject } from '@/core/index.js';

import { HttpResponse, Middleware, RouterMiddleware, type RouterMiddlewareContext } from '@/modules/router/index.js';

import { AuthenticationService } from '@/services/index.js';

export interface AuthMiddlewareOptions {
	secretKey: string;
}

@Middleware()
export class AuthenticationMiddleware extends RouterMiddleware {
	static options: AuthMiddlewareOptions;

	constructor(@Inject(AuthenticationService) private readonly authService: AuthenticationService) {
		super();
	}

	async execute(context: RouterMiddlewareContext, options: AuthMiddlewareOptions) {
		const authHeader = context.request.headers['authorization'];
		const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
		const tokenPayload = token ? this.authService.verifyToken(token, 'auth') : null;

		if (!tokenPayload) {
			return HttpResponse.error(401, 'INVALID_TOKEN', { message: 'Invalid or missing authorization token' });
		}

		context.state.userId = tokenPayload.id;
	}
}
