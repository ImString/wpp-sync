import { z } from 'zod';

import { RouteSchema } from '@/modules/index.js';

export namespace AuthenticationDTO {
	export const Login = new RouteSchema({
		body: z.object({
			email: z.string().email(),
			password: z.string().min(6).max(32)
		})
	});

	export const Register = new RouteSchema({
		body: z.object({
			name: z.string().trim().min(2).max(64),
			email: z.string().email(),
			phone: z
				.string()
				.regex(/^\+?[0-9]{10,15}$/)
				.optional(),
			password: z.string().min(3).max(32)
		})
	});

	export const Refresh = new RouteSchema({
		body: z.object({
			refresh_token: z.string()
		})
	});
}
