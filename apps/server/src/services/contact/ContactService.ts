import { applyPrismaPagination, PaginationOptions, prisma, Prisma } from '@wppsync/database';

import { Provider } from '@/core/index.js';

import { ContactEntity, ContactStageEntity } from '@/entities/data/index.js';
import { ContactAlreadyExistsError } from '@/entities/errors/contact/ContactAlreadyExistsError.js';
import { ContactNotFoundError } from '@/entities/errors/contact/ContactNotFoundError.js';

export type ContactServiceWhereInput = Prisma.ContactWhereInput;
export type ContactServiceWhereOptions = {
	id?: string;
	ids?: string[];

	search?: string;
	stage?: string;
	order?: 'recent' | 'name';
	whatsapp?: string;
	isDeleted?: boolean;

	workspace?: string;

	include?: Prisma.ContactInclude;
};

@Provider()
export class ContactService {
	private mountWhere(options: ContactServiceWhereOptions): ContactServiceWhereInput {
		return {
			...(options.id && { id: options.id }),
			...(options.ids && { id: { in: options.ids } }),

			...(options.whatsapp && {
				whatsapp: {
					contains: options.whatsapp,
					mode: 'insensitive'
				}
			}),

			...(options.search && {
				OR: [
					{
						name: options.search && {
							contains: options.search,
							mode: 'insensitive'
						}
					},
					{
						pushName: options.search && {
							contains: options.search,
							mode: 'insensitive'
						}
					},
					{
						whatsapp: options.search && {
							contains: options.search,
							mode: 'insensitive'
						}
					},
					{
						email: options.search && {
							contains: options.search,
							mode: 'insensitive'
						}
					}
				]
			}),

			...(options.stage && { contactStageId: options.stage }),

			isDeleted: options.isDeleted || false,

			...(options.workspace && {
				workspaceId: options.workspace
			})
		};
	}

	async list(options: ContactServiceWhereOptions & PaginationOptions) {
		const [dataList, dataListTotal] = await prisma.$transaction([
			prisma.contact.findMany({
				where: {
					...this.mountWhere(options)
				},
				include: {
					...options.include
				},
				orderBy:
					options.order === 'name'
						? [
								{ name: { sort: 'asc', nulls: 'last' } },
								{ pushName: { sort: 'asc', nulls: 'last' } },
								{ createdAt: 'desc' }
							]
						: { createdAt: 'desc' },
				...applyPrismaPagination(options)
			}),
			prisma.contact.count({
				where: {
					...this.mountWhere(options)
				}
			})
		]);

		const contacts = ContactEntity.fromList(dataList);
		const items = await Promise.all(contacts.items.map(contact => contact.toObject({ sign_files: true })));

		return {
			items,
			total: dataListTotal
		};
	}

	async get(options: ContactServiceWhereOptions) {
		const data = await prisma.contact.findFirst({
			where: {
				...this.mountWhere(options)
			},
			include: options.include
		});

		if (!data) throw new ContactNotFoundError();

		return new ContactEntity(data);
	}

	async create(document: {
		name?: string;
		pushName?: string;
		author?: string;
		whatsapp: string;
		email?: string;
		stage?: ContactStageEntity;
		tags?: string[];
		notes?: string;
		workspace: string;
	}) {
		const phoneNumber = this.normalisePhoneNumber(document.whatsapp);

		const alreadyExists = await this.get({
			whatsapp: phoneNumber,
			workspace: document.workspace
		}).catch(() => null);

		if (alreadyExists) throw new ContactAlreadyExistsError();

		const contactArchive = await this.get({
			whatsapp: phoneNumber,
			isDeleted: true,
			workspace: document.workspace
		}).catch(() => null);

		if (contactArchive) return await this.update(contactArchive, { ...document, isDeleted: false });

		const contact = await prisma.contact.create({
			data: {
				name: document.name,
				pushName: document.pushName,
				whatsapp: phoneNumber,
				email: document.email,
				...(document.stage && {
					contactStageId: document.stage.data.id
				}),
				tags: document.tags,
				notes: document.notes,
				createdBy: document.author,
				workspaceId: document.workspace
			}
		});

		const contactEntity = new ContactEntity(contact, { stage: document.stage });

		return contactEntity;
	}

	async update(
		contact: ContactEntity,
		document: {
			name?: string;
			author?: string;
			whatsapp?: string;
			email?: string | null;
			stage?: ContactStageEntity | null;
			tags?: string[];
			notes?: string;
			isDeleted?: boolean;
		}
	) {
		contact.addChanges({
			isDeleted: document.isDeleted || false,
			name: document.name,
			...(document.whatsapp && {
				whatsapp: this.normalisePhoneNumber(document.whatsapp)
			}),
			email: document.email,
			...(document.stage !== undefined && {
				contactStageId: document.stage?.data.id || null
			}),
			tags: document.tags,
			notes: document.notes,
			createdBy: document.author
		});

		await contact.save();

		if (document.stage !== undefined) contact.entities.stage = document.stage;

		return contact;
	}

	private normalisePhoneNumber(phoneNumber: string): string {
		const digits = phoneNumber.replace(/\D/g, '');

		if (!digits.startsWith('55')) return digits;

		const ddd = digits.slice(2, 4);
		let number = digits.slice(4);

		if (number.length === 9 && /^[2-5]/.test(number.slice(1))) {
			return `55${ddd}${number.slice(1)}`;
		}

		if (number.length === 8 && /^[2-5]/.test(number)) {
			return `55${ddd}${number}`;
		}

		if (number.length === 9 && number.startsWith('9')) {
			return `55${ddd}${number}`;
		}

		return `55${ddd}9${number}`;
	}
}
