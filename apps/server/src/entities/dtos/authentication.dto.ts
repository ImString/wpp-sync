import { z } from 'zod';

import { RouteSchema } from '@/modules/index.js';

export namespace AuthenticationDTO {
	export const Login = new RouteSchema({
		body: z.object({
			email: z.email(),
			password: z.string().min(6).max(32),
			turnstileToken: z.string().min(1).max(2048)
		})
	});

	export const Register = new RouteSchema({
		body: z.object({
			name: z.string().trim().min(2).max(64),
			email: z.email(),
			phone: z
				.string()
				.regex(/^\+?[0-9]{10,15}$/)
				.optional(),
			password: z.string().min(3).max(32),
			turnstileToken: z.string().min(1).max(2048)
		})
	});

	export const Refresh = new RouteSchema({
		body: z.object({
			refresh_token: z.string()
		})
	});

	export const OAuthGoogleLogin = new RouteSchema({
		body: z.object({
			code: z.string().optional(),
			token: z.string().optional(),
			state: z.uuid()
		})
	});
}
