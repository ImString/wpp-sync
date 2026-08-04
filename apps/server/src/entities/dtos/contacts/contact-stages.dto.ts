import z from 'zod';

import { RouteSchema } from '@/modules/index.js';

export namespace ContactStagesDTO {
	export const Get = new RouteSchema({
		params: z.object({
			uid: z.string(),
			dataId: z.string()
		})
	});

	export const Create = new RouteSchema({
		body: z.object({
			name: z.string(),
			icon: z.string(),
			color: z.string().regex(/^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, {
				message: 'Invalid hex color format'
			}),
			description: z.string().max(180).optional()
		})
	});

	export const Update = new RouteSchema({
		body: z.object({
			name: z.string().optional(),
			icon: z.string().optional(),
			color: z
				.string()
				.regex(/^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, {
					message: 'Invalid hex color format'
				})
				.optional(),
			description: z.string().max(180).optional()
		})
	});
}
