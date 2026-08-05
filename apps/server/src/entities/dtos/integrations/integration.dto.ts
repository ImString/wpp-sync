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

	export const Delete = new RouteSchema({
		params: z.object({
			uid: z.string(),
			dataId: z.string()
		})
	});
}
