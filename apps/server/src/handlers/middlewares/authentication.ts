import { Middleware, RouterMiddleware, type RouterMiddlewareContext } from '@/modules/router/index.js';

import { AuthenticationService } from '@/services/index.js';

import { InvalidTokenError } from '@/entities/errors/authentication/index.js';

@Middleware()
export class AuthenticationMiddleware extends RouterMiddleware {
	constructor(private readonly authService: AuthenticationService) {
		super();
	}

	async execute(context: RouterMiddlewareContext) {
		const authHeader = context.request.headers['authorization'];
		const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

		if (!token) throw new InvalidTokenError('Invalid or missing authorization token.');

		const tokenPayload = this.authService.verifyToken(token, 'auth');
		if (!tokenPayload || !tokenPayload.id) throw new InvalidTokenError('Invalid or missing authorization token.');

		context.state.userId = tokenPayload.id;
	}
}
