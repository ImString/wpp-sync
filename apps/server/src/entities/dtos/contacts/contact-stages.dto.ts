import { stageIconNames } from '@wppsync/shared/contact-stages';
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
			name: z.string().trim().min(1).max(80),
			icon: z.enum(stageIconNames),
			color: z.string().regex(/^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, {
				message: 'Invalid hex color format'
			}),
			description: z.string().max(180).optional()
		})
	});

	export const Update = new RouteSchema({
		params: z.object({
			uid: z.string(),
			dataId: z.string()
		}),
		body: z.object({
			name: z.string().trim().min(1).max(80).optional(),
			icon: z.enum(stageIconNames).optional(),
			color: z
				.string()
				.regex(/^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, {
					message: 'Invalid hex color format'
				})
				.optional(),
			description: z.string().max(180).nullable().optional()
		})
	});

	export const Reorder = new RouteSchema({
		body: z.object({
			stageIds: z.array(z.string()).min(1)
		})
	});

	export const Delete = new RouteSchema({
		params: z.object({
			uid: z.string(),
			dataId: z.string()
		}),
		body: z.object({
			replacementStageId: z.string().optional()
		})
	});
}
