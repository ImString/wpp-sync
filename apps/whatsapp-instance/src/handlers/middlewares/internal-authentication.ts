import { Middleware, RouterMiddleware, ServerError, type RouterMiddlewareContext } from '@wppsync/backend';
import { timingSafeEqual } from 'node:crypto';

import { environment } from '@/config/index.js';

@Middleware()
export class InternalAuthenticationMiddleware extends RouterMiddleware {
	async execute(context: RouterMiddlewareContext): Promise<void> {
		if (!environment.apiToken) {
			throw new ServerError(503, 'INSTANCE_API_TOKEN_NOT_CONFIGURED', {
				message: 'Internal API authentication is not configured.'
			});
		}

		const authorization = context.request.headers.authorization;
		const provided = authorization?.startsWith('Bearer ') ? authorization.slice(7) : authorization;

		if (!provided || !this.matches(provided, environment.apiToken)) {
			throw new ServerError(401, 'UNAUTHORIZED', { message: 'Invalid instance API token.' });
		}
	}

	private matches(provided: string, expected: string): boolean {
		const providedBuffer = Buffer.from(provided);
		const expectedBuffer = Buffer.from(expected);

		return providedBuffer.length === expectedBuffer.length && timingSafeEqual(providedBuffer, expectedBuffer);
	}
}
