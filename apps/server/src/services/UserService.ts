import { prisma } from '@wppsync/database';

import { Provider } from '@/core/index.js';

import { UserNotFoundError } from '@/entities/errors/user/index.js';

@Provider()
export class UserService {
	async getById(id: string) {
		const user = await prisma.user.findUnique({
			where: { id },
			select: {
				id: true,
				name: true,
				email: true,
				phone: true,
				createdAt: true,
				updatedAt: true
			}
		});

		if (!user) throw new UserNotFoundError();

		return user;
	}
}
