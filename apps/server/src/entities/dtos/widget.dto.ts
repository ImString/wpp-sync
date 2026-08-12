import z from 'zod';

import { RouteSchema } from '@/modules/index.js';

export namespace WidgetDTO {
	export const Start = new RouteSchema({
		params: z.object({
			integrationId: z.string()
		}),
		body: z.object({
			name: z
				.string()
				.trim()
				.min(1)
				.max(100)
				.regex(/^[^\p{N}]*$/u, 'Name cannot contain numbers.'),
			email: z.string().trim().toLowerCase().email().max(254)
		})
	});

	export const Recover = new RouteSchema({
		params: z.object({
			integrationId: z.string()
		})
	});

	export const Messages = new RouteSchema({
		params: z.object({
			integrationId: z.string()
		}),
		query: z.object({
			cursor: z.coerce.number().min(1).optional(),
			limit: z.coerce.number().min(1).max(100).optional()
		})
	});

	const SendFields = z
		.object({
			text: z.coerce.string().trim().min(1).max(1000).optional(),
			signature: z.boolean().optional()
		})
		.strict();

	export const Send = new RouteSchema({
		params: z.object({
			integrationId: z.string()
		}),
		body: SendFields,
		form: {
			fields: SendFields,
			options: {
				limits: {
					fields: 2,
					files: 10,
					parts: 12,
					fileSize: 55 * 1024 * 1024
				}
			}
		}
	});
}
