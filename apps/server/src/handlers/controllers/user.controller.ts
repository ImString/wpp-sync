import { Inject } from '@/core/index.js';

import { Controller, Get, HttpResponse, type RouterMiddlewareContext } from '@/modules/index.js';

import { UserService } from '@/services/index.js';

import { InvalidTokenError } from '@/entities/errors/authentication/index.js';

import { AuthenticationMiddleware } from '../middlewares/authentication.js';

@Controller({
	path: '/user',
	middlewares: [AuthenticationMiddleware]
})
export class UserController {
	constructor(@Inject(UserService) private readonly userService: UserService) {}

	@Get('/me')
	async getProfile(context: RouterMiddlewareContext) {
		const userId = context.state.userId;

		if (!userId) throw new InvalidTokenError('Invalid or missing authorization token.');

		const user = await this.userService.getById(userId);
		return HttpResponse.success(user);
	}
}
