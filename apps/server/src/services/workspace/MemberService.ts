import { prisma, Prisma, Role } from '@wppsync/database';

import { Provider } from '@/core/index.js';

import { MemberEntity } from '@/entities/data/workspaces/members.entity.js';
import { MemberNotFoundError } from '@/entities/errors/workspace/index.js';

export type MemberServiceWhereInput = Prisma.MemberWhereInput;
export type MemberServiceWhereOptions = {
	id?: string;

	searchName?: string;
	searchWorkspace?: string;

	userId?: string;
	workspaceId?: string;

	include?: Prisma.MemberInclude;
};
export type MemberServiceListOptions = MemberServiceWhereOptions & {
	workspaceOwnerId?: string;
};

@Provider()
export class MemberService {
	private mountWhere(options: MemberServiceWhereOptions): MemberServiceWhereInput {
		return {
			...(options.id && { id: options.id }),
			...(options.searchName && {
				user: {
					OR: [
						{
							name: {
								contains: options.searchName,
								mode: 'insensitive'
							}
						},
						{
							email: {
								contains: options.searchName,
								mode: 'insensitive'
							}
						}
					]
				}
			}),
			...(options.searchWorkspace && {
				workspace: {
					name: {
						contains: options.searchWorkspace,
						mode: 'insensitive'
					}
				}
			}),
			...(options.userId && { userId: options.userId }),
			...(options.workspaceId && { workspaceId: options.workspaceId })
		};
	}

	async list(document: MemberServiceListOptions) {
		const [dataList, dataListTotal] = await prisma.$transaction([
			prisma.member.findMany({
				where: {
					...this.mountWhere(document),
					disabled: false
				},
				include: {
					...document.include
				}
			}),
			prisma.member.count({
				where: {
					...this.mountWhere(document)
				}
			})
		]);

		const members = MemberEntity.fromList(dataList);
		const items = await Promise.all(
			members.items.map(member =>
				member.toObject({
					sign_files: true,
					workspaceOwnerId: document.workspaceOwnerId
				})
			)
		);

		return {
			items,
			total: dataListTotal
		};
	}

	async get(options: MemberServiceWhereOptions): Promise<MemberEntity> {
		const data = await prisma.member.findFirst({
			where: {
				...this.mountWhere(options)
			},
			include: options.include
		});

		if (!data) throw new MemberNotFoundError();

		return new MemberEntity(data);
	}

	async update(document: { id: string; workspaceId: string; role: Role }) {
		const member = await this.get({
			id: document.id,
			workspaceId: document.workspaceId
		});

		if (member.data.disabled) throw new MemberNotFoundError();

		await prisma.member.update({
			data: {
				role: document.role
			},
			where: {
				id: document.id,
				workspaceId: document.workspaceId
			}
		});
	}

	async remove(document: { id: string; workspaceId: string }) {
		const member = await this.get({
			id: document.id,
			workspaceId: document.workspaceId
		});

		if (member.data.disabled) throw new MemberNotFoundError();

		await prisma.member.update({
			data: {
				disabled: true
			},
			where: {
				id: document.id,
				workspaceId: document.workspaceId
			}
		});
	}
}
