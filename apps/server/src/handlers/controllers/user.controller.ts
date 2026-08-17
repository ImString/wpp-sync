import { Controller, Get, HttpResponse, Put, type RouteSchemaContext } from '@/modules/index.js';

import { AuthenticationService, UserService } from '@/services/index.js';

import { UserDTO } from '@/entities/dtos/user.dto.js';

import { AuthenticationMiddleware } from '../middlewares/authentication.js';

@Controller({
	path: '/user',
	middlewares: [AuthenticationMiddleware]
})
export class UserController {
	constructor(
		private readonly userService: UserService,
		private readonly authenticationService: AuthenticationService
	) {}

	@Get('/me')
	async getProfile(context: RouteSchemaContext) {
		const userId = context.state.userId;

		const user = await this.userService.get({ id: userId, include: { avatar: true } });
		return HttpResponse.success(await user.toObject({ sign_files: true }));
	}

	@Put('/update', UserDTO.UpdateProfile)
	async updateProfile(context: typeof UserDTO.UpdateProfile.context) {
		const userId = context.state.userId;

		const form = await UserDTO.UpdateProfile.toForm({ request: context.request });
		const avatar = form.files.find(file => file.fieldname === 'avatar');
		const user = await this.userService.updateProfile(userId, form.fields, avatar);

		return HttpResponse.success(user);
	}

	@Put('/password', UserDTO.UpdatePassword)
	async updatePassword(context: typeof UserDTO.UpdatePassword.context) {
		const result = await this.authenticationService.updatePassword(context.state.userId, context.body);

		return HttpResponse.success(result);
	}
}
