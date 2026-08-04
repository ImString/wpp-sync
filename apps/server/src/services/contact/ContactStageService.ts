import { prisma, Prisma } from '@wppsync/database';

import { Provider } from '@/core/index.js';

import { ContactStageEntity } from '@/entities/data/index.js';
import { ContactStageNotFoundError } from '@/entities/errors/contact/ContactStageNotFoundError.js';

export type ContactStageServiceWhereInput = Prisma.ContactStageWhereInput;
export type ContactStageServiceWhereOptions = {
	id?: string;

	workspace?: string;

	include?: Prisma.ContactStageInclude;
};

@Provider()
export class ContactStageService {
	private mountWhere(options: ContactStageServiceWhereOptions): ContactStageServiceWhereInput {
		return {
			...(options.id && { id: options.id }),

			...(options.workspace && {
				workspaceId: options.workspace
			})
		};
	}

	async list(options: ContactStageServiceWhereOptions) {
		const [dataList, dataListTotal] = await prisma.$transaction([
			prisma.contactStage.findMany({
				where: {
					...this.mountWhere(options)
				},
				include: {
					...options.include
				},
				orderBy: {
					createdAt: 'desc'
				}
			}),
			prisma.contactStage.count({
				where: {
					...this.mountWhere(options)
				}
			})
		]);

		const contactStages = ContactStageEntity.fromList(dataList);
		const items = await Promise.all(contactStages.items.map(contactStage => contactStage.toObject({})));

		return {
			items,
			total: dataListTotal
		};
	}

	async get(options: ContactStageServiceWhereOptions) {
		const data = await prisma.contactStage.findFirst({
			where: {
				...this.mountWhere(options)
			},
			include: options.include
		});

		if (!data) throw new ContactStageNotFoundError();

		return new ContactStageEntity(data);
	}

	async create(document: { name: string; color: string; icon: string; description?: string; workspace: string }) {
		const contactStage = await prisma.contactStage.create({
			data: {
				name: document.name,
				color: document.color,
				icon: document.icon,
				...(document.description && { description: document.description }),
				workspaceId: document.workspace
			}
		});

		const contactStageEntity = new ContactStageEntity(contactStage);

		return contactStageEntity;
	}

	async update(
		contactStage: ContactStageEntity,
		document: { name?: string; color?: string; icon?: string; description?: string }
	) {
		contactStage.addChanges({
			name: document.name,
			color: document.color,
			icon: document.icon,
			...(document.description && { description: document.description })
		});

		await contactStage.save();

		return contactStage;
	}
}
