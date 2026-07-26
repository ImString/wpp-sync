import { Inject } from '@/core/index.js';

import { Controller, Get, HttpResponse, type RouterMiddlewareContext } from '@/modules/index.js';

import { UserService } from '@/services/index.js';

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

		if (!userId) {
			return HttpResponse.error(401, 'INVALID_TOKEN', {
				message: 'Invalid or missing authorization token.'
			});
		}

		const user = await this.userService.findById(userId);

		if (!user) {
			return HttpResponse.error(404, 'USER_NOT_FOUND', {
				message: 'User not found.'
			});
		}

		return HttpResponse.success(user);
	}
}
