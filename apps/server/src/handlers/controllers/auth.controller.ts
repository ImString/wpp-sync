import { Controller, HttpResponse, Post } from '@/modules/index.js';

import { AuthenticationService } from '@/services/index.js';

import { AuthenticationDTO } from '@/entities/dtos/authentication.dto.js';

@Controller({
	path: '/auth'
})
export class AuthController {
	constructor(private readonly authenticationService: AuthenticationService) {}

	@Post('/login', AuthenticationDTO.Login)
	async login(context: typeof AuthenticationDTO.Login.context) {
		const { email, password } = context.body;
		const session = await this.authenticationService.login({ email, password });

		return HttpResponse.success(session);
	}

	@Post('/register', AuthenticationDTO.Register)
	async register(context: typeof AuthenticationDTO.Register.context) {
		const { name, email, phone, password } = context.body;
		const user = await this.authenticationService.register({ name, email, phone, password });

		return HttpResponse.created(user);
	}

	@Post('/refresh-token', AuthenticationDTO.Refresh)
	async refreshToken(context: typeof AuthenticationDTO.Refresh.context) {
		const { refresh_token } = context.body;
		const session = this.authenticationService.refreshToken(refresh_token);

		return HttpResponse.success(session);
	}
}
