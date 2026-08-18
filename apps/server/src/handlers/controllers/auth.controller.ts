import { Controller, Get, HttpResponse, Post } from '@/modules/index.js';

import { AuthenticationService, AuthenticationGoogleService, TurnstileService } from '@/services/index.js';

import { AuthenticationDTO } from '@/entities/dtos/authentication.dto.js';

@Controller({
	path: '/auth'
})
export class AuthController {
	constructor(
		private readonly authenticationService: AuthenticationService,
		private readonly authenticationGoogleService: AuthenticationGoogleService,
		private readonly turnstileService: TurnstileService
	) {}

	@Post('/login', AuthenticationDTO.Login)
	async login(context: typeof AuthenticationDTO.Login.context) {
		const { email, password, turnstileToken } = context.body;
		await this.turnstileService.verify({ token: turnstileToken, action: 'login', remoteIp: context.request.ip });
		const session = await this.authenticationService.login({ email, password });

		return HttpResponse.success(session);
	}

	@Post('/register', AuthenticationDTO.Register)
	async register(context: typeof AuthenticationDTO.Register.context) {
		const { name, email, phone, password, turnstileToken } = context.body;
		await this.turnstileService.verify({ token: turnstileToken, action: 'register', remoteIp: context.request.ip });
		const user = await this.authenticationService.register({ name, email, phone, password });

		return HttpResponse.created(user);
	}

	@Get('/turnstile/config')
	async getTurnstileConfiguration() {
		return HttpResponse.success(this.turnstileService.getPublicConfiguration());
	}

	@Post('/refresh-token', AuthenticationDTO.Refresh)
	async refreshToken(context: typeof AuthenticationDTO.Refresh.context) {
		const { refresh_token } = context.body;
		const session = this.authenticationService.refreshToken(refresh_token);

		return HttpResponse.success(session);
	}

	@Get('/google/url')
	async getGoogleAuthUrl() {
		const response = await this.authenticationGoogleService.generateAuthUrl();
		return HttpResponse.success(response);
	}

	@Post('/google/login', AuthenticationDTO.OAuthGoogleLogin)
	async googleLogin(context: typeof AuthenticationDTO.OAuthGoogleLogin.context) {
		const { user, isNewIntegration } = await this.authenticationGoogleService.loginWithGoogle({
			code: context.body.code,
			token: context.body.token,
			state: context.body.state
		});
		const session = this.authenticationService.createSession(user.id);

		return HttpResponse.success({
			...session,
			isNewIntegration,
			user: await user.toObject()
		});
	}
}
