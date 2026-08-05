import { prisma, Prisma } from '@wppsync/database';
import { Slug } from '@wppsync/shared';
import type { StageIconName } from '@wppsync/shared/contact-stages';

import { Provider } from '@/core/index.js';

import { ContactStageEntity } from '@/entities/data/index.js';
import { ContactStageAlreadyExistsError } from '@/entities/errors/contact/ContactStageAlreadyExistsError.js';
import { ContactStageNotFoundError } from '@/entities/errors/contact/ContactStageNotFoundError.js';

export type ContactStageServiceWhereInput = Prisma.ContactStageWhereInput;
export type ContactStageServiceWhereOptions = {
	id?: string;
	slug?: string;

	workspace?: string;

	include?: Prisma.ContactStageInclude;
};

@Provider()
export class ContactStageService {
	private mountWhere(options: ContactStageServiceWhereOptions): ContactStageServiceWhereInput {
		return {
			...(options.id && { id: options.id }),
			...(options.slug && { slug: options.slug }),

			...(options.workspace && {
				workspaceId: options.workspace
			})
		};
	}

	private async ensureNameIsAvailable(workspace: string, name: string, currentStageId?: string) {
		const slug = Slug.createSlug(name);
		const stages = await prisma.contactStage.findMany({
			where: {
				workspaceId: workspace,
				...(currentStageId && { NOT: { id: currentStageId } })
			},
			select: { name: true, slug: true }
		});

		if (stages.some(stage => (stage.slug || Slug.createSlug(stage.name)) === slug)) {
			throw new ContactStageAlreadyExistsError();
		}

		return slug;
	}

	async list(options: ContactStageServiceWhereOptions) {
		const [dataList, dataListTotal, contactsTotal] = await prisma.$transaction([
			prisma.contactStage.findMany({
				where: {
					...this.mountWhere(options)
				},
				include: {
					...options.include,
					_count: {
						select: {
							contacts: {
								where: { isDeleted: false }
							}
						}
					}
				},
				orderBy: [{ position: 'asc' }, { createdAt: 'asc' }]
			}),
			prisma.contactStage.count({
				where: {
					...this.mountWhere(options)
				}
			}),
			prisma.contact.count({
				where: {
					isDeleted: false,
					...(options.workspace && { workspaceId: options.workspace })
				}
			})
		]);

		const contactStages = ContactStageEntity.fromList(dataList);
		const items = await Promise.all(contactStages.items.map(contactStage => contactStage.toObject({})));

		return {
			items,
			total: dataListTotal,
			contactsTotal
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

	async create(document: {
		name: string;
		color: string;
		icon: StageIconName;
		description?: string;
		workspace: string;
	}) {
		const slug = await this.ensureNameIsAvailable(document.workspace, document.name);
		const lastStage = await prisma.contactStage.findFirst({
			where: { workspaceId: document.workspace },
			orderBy: { position: 'desc' },
			select: { position: true }
		});
		const contactStage = await prisma.contactStage.create({
			data: {
				name: document.name,
				slug,
				color: document.color,
				icon: document.icon,
				...(document.description && { description: document.description }),
				position: (lastStage?.position ?? -1) + 1,
				workspaceId: document.workspace
			}
		});

		const contactStageEntity = new ContactStageEntity(contactStage);

		return contactStageEntity;
	}

	async update(
		contactStage: ContactStageEntity,
		document: {
			name?: string;
			color?: string;
			icon?: StageIconName;
			description?: string | null;
			position?: number;
		}
	) {
		const slug = document.name
			? await this.ensureNameIsAvailable(contactStage.data.workspaceId!, document.name, contactStage.id)
			: undefined;

		contactStage.addChanges({
			name: document.name,
			slug,
			color: document.color,
			icon: document.icon,
			description: document.description,
			position: document.position
		});

		await contactStage.save();

		return contactStage;
	}

	async reorder(workspace: string, stageIds: string[]) {
		const stages = await prisma.contactStage.findMany({
			where: { workspaceId: workspace },
			select: { id: true }
		});

		if (stages.length !== stageIds.length || stages.some(stage => !stageIds.includes(stage.id))) {
			throw new ContactStageNotFoundError();
		}

		await prisma.$transaction(
			stageIds.map((id, position) =>
				prisma.contactStage.update({
					where: { id },
					data: { position }
				})
			)
		);
	}

	async delete(contactStage: ContactStageEntity, replacementStage?: ContactStageEntity) {
		if (replacementStage?.id === contactStage.id) throw new ContactStageNotFoundError();

		await prisma.$transaction([
			prisma.contact.updateMany({
				where: { contactStageId: contactStage.id },
				data: { contactStageId: replacementStage?.id || null }
			}),
			prisma.contactStage.delete({ where: { id: contactStage.id } })
		]);
	}
}
