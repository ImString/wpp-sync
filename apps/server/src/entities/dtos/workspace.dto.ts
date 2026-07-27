import { z } from 'zod';

import { RouteSchema } from '@/modules/index.js';

export namespace WorkspaceDTO {
	export const CreateFields = z.object({
		name: z.string().trim().min(1).max(128)
	}).strict();

	export const Create = new RouteSchema({
		form: {
			fields: CreateFields,
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

	export const List = new RouteSchema({});

	export type CreateDocument = z.infer<typeof CreateFields>;
}
