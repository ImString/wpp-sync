import z from 'zod';

import { RouteSchema } from '@/modules/index.js';

export namespace ContactsDTO {
	const TagsSchema = z
		.union([z.string(), z.array(z.string())])
		.transform((value): string[] => {
			const tags = typeof value === 'string' ? value.split(',') : value;

			return tags.map(tag => tag.trim()).filter(tag => tag.length > 0);
		})
		.pipe(z.array(z.string().min(1)));

	export const List = new RouteSchema({
		query: z.object({
			search: z.string().trim().optional(),
			stage: z.string().optional(),
			order: z.enum(['recent', 'name']).optional(),
			page: z.coerce.number().min(1).optional(),
			limit: z.coerce.number().min(1).max(100).optional()
		})
	});

	export const Get = new RouteSchema({
		params: z.object({
			uid: z.string(),
			dataId: z.string()
		})
	});

	export const Create = new RouteSchema({
		body: z.object({
			name: z.string(),
			whatsapp: z.string(),
			email: z.string().email().optional(),
			stage: z.string().optional(),
			tags: TagsSchema.default([]),
			notes: z.string().optional()
		})
	});

	export const Update = new RouteSchema({
		params: z.object({
			uid: z.string(),
			dataId: z.string()
		}),
		body: z.object({
			name: z.string().optional(),
			whatsapp: z.string().optional(),
			email: z.string().email().nullable().optional(),
			stage: z.string().nullable().optional(),
			tags: TagsSchema.optional(),
			notes: z.string().optional()
		})
	});

	export const Delete = new RouteSchema({
		params: z.object({
			uid: z.string(),
			dataId: z.string()
		})
	});
}
