import { prisma } from '@wppsync/database';

import { Provider } from '@/core/index.js';

@Provider()
export class UserService {
	findById(id: string) {
		return prisma.user.findUnique({
			where: { id },
			select: {
				name: true,
				email: true,
				phone: true,
				createdAt: true,
				updatedAt: true
			}
		});
	}
}
