import { IntegrationStatus, IntegrationType } from '@wppsync/database';
import z from 'zod';

import { RouteSchema } from '@/modules/index.js';

export namespace IntegrationDTO {
	export const List = new RouteSchema({
		query: z.object({
			search: z.string().optional(),
			page: z.coerce.number().min(1).optional(),
			limit: z.coerce.number().min(1).max(100).optional(),
			status: z.nativeEnum(IntegrationStatus).optional()
		})
	});

	export const AllCount = new RouteSchema({});

	export const Get = new RouteSchema({
		params: z.object({
			uid: z.string(),
			dataId: z.string()
		})
	});

	export const Create = new RouteSchema({
		body: z.object({
			name: z.string(),
			type: z.nativeEnum(IntegrationType)
		})
	});

	export const Update = new RouteSchema({
		params: z.object({
			uid: z.string(),
			dataId: z.string()
		}),
		body: z.object({
			name: z.string().optional()
		})
	});

	export const WebConfigFields = z
		.object({
			name: z.string().trim().min(1).max(128).optional(),
			headerName: z.string().trim().min(1).max(64),
			removeHeaderPhoto: z.boolean().optional()
		})
		.strict();

	export const WebConfig = new RouteSchema({
		params: z.object({
			uid: z.string(),
			dataId: z.string()
		}),
		form: {
			fields: WebConfigFields,
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

	export type WebConfigDocument = z.infer<typeof WebConfigFields>;

	export const Delete = new RouteSchema({
		params: z.object({
			uid: z.string(),
			dataId: z.string()
		})
	});
}
