import { Controller, HttpResponse, Post } from '@/modules/index.js';

import { AuthenticationService } from '@/services/AuthenticationService.js';

import { AuthenticationDTO } from '@/entities/dtos/authentication.dto.js';

@Controller({
	path: '/auth'
})
export class AuthController {
	constructor(private readonly authenticationService: AuthenticationService) {}

	@Post('/login', AuthenticationDTO.Login)
	async login(context: typeof AuthenticationDTO.Login.context) {
		const { email, password } = context.body;

		const response = await this.authenticationService.login({ email, password });
		return HttpResponse.success(response);
	}

	@Post('/register', AuthenticationDTO.Register)
	async register(context: typeof AuthenticationDTO.Register.context) {
		const { name, email, phone, password } = context.body;

		const response = await this.authenticationService.register({ name, email, phone, password });
		return HttpResponse.success(response);
	}

	@Post('/refresh-token', AuthenticationDTO.Refresh)
	async refreshToken(context: typeof AuthenticationDTO.Refresh.context) {
		const { refresh_token } = context.body;

		const actualToken = this.authenticationService.verifyToken(refresh_token, 'refresh');
		if (!actualToken) {
			return HttpResponse.error(401, 'INVALID_TOKEN', {
				message: 'Invalid token.'
			});
		}

		const newAuthToken = this.authenticationService.generateToken(actualToken.id, 'auth');

		const currentTime = new Date().getTime();
		const tokenExpiryTime = actualToken.exp * 1000;
		const checkRefreshTokenExpired = currentTime > tokenExpiryTime - 7 * 60 * 60 * 24 * 1000;

		if (checkRefreshTokenExpired) {
			return HttpResponse.success({
				token: newAuthToken,
				refreshToken: this.authenticationService.generateToken(actualToken.id, 'refresh')
			});
		}

		return HttpResponse.success({ token: newAuthToken });
	}
}
