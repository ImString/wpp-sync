import { z } from 'zod';

import { RouteSchema } from '@/modules/index.js';

export namespace UserDTO {
	export const UpdateProfileFields = z
		.object({
			name: z.string().trim().min(2).max(64).optional(),
			phone: z
				.string()
				.trim()
				.regex(/^\+?[0-9]{10,15}$/)
				.optional(),
			enterprise: z.string().trim().min(1).max(128).optional()
		})
		.strict();

	export const UpdateProfile = new RouteSchema({
		form: {
			fields: UpdateProfileFields,
			options: {
				limits: {
					fields: 3,
					files: 1,
					parts: 4,
					fileSize: 5 * 1024 * 1024
				}
			}
		}
	});

	export type UpdateProfileDocument = z.infer<typeof UpdateProfileFields>;
}
