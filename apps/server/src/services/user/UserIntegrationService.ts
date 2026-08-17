import { Provider } from '@wppsync/backend';
import { prisma, Prisma, UserIntegrationType } from '@wppsync/database';

import { UserEntity, UserIntegrationEntity } from '@/entities/data/index.js';

export type UserIntegrationServiceWhereInput = Prisma.UserIntegrationWhereInput;
export type UserIntegrationServiceWhereOptions = {
	id?: string;
	email?: string;

	include?: Prisma.UserIntegrationInclude;
};

@Provider()
export class UserIntegrationService {
	private mountWhere(options: UserIntegrationServiceWhereOptions): UserIntegrationServiceWhereInput {
		return {
			...(options.id && { id: options.id })
		};
	}

	async get(options: UserIntegrationServiceWhereOptions) {
		const data = await prisma.userIntegration.findFirst({
			where: {
				...this.mountWhere(options)
			},
			include: options.include
		});

		if (!data) throw new Error();

		return new UserIntegrationEntity(data);
	}

	async create(document: { user: UserEntity; type: UserIntegrationType; providerId: string; providerName: string }) {
		const userIntegration = await prisma.userIntegration.create({
			data: {
				userId: document.user.id,
				type: document.type,
				providerId: document.providerId,
				providerName: document.providerName
			}
		});

		const userIntegrationEntity = new UserIntegrationEntity(userIntegration);

		return userIntegrationEntity;
	}
}
