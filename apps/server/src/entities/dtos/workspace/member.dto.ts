import z from 'zod';

import { RouteSchema } from '@/modules/index.js';

export namespace WorksapceMemberDTO {
	export const Get = new RouteSchema({
		params: z.object({
			memberId: z.string()
		})
	});
}
