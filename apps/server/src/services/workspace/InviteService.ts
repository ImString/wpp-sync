import { prisma, Prisma, Role } from '@wppsync/database';

import { Provider } from '@/core/index.js';

import { InviteEntity } from '@/entities/data/workspaces/invites.entity.js';
import { UserNotFoundError } from '@/entities/errors/user/UserNotFoundError.js';
import { InviteNotFoundError } from '@/entities/errors/workspace/index.js';
import { InviteWithSameEmailError } from '@/entities/errors/workspace/invites/InviteWithSameEmailError.js';

export type InvitesServiceWhereInput = Prisma.InviteWhereInput;
export type InvitesServiceWhereOptions = {
	id?: string;

	email?: string;
	workspaceName?: string;
	workspaceId?: string;

	include?: Prisma.InviteInclude;
};

@Provider()
export class InviteService {
	private mountWhere(options: InvitesServiceWhereOptions): InvitesServiceWhereInput {
		return {
			...(options.id && { id: options.id }),
			...(options.email && { email: options.email }),
			...(options.workspaceName && {
				workspace: {
					name: {
						contains: options.workspaceName,
						mode: 'insensitive'
					}
				}
			}),
			...(options.workspaceId && { workspaceId: options.workspaceId })
		};
	}

	async list(options: InvitesServiceWhereOptions) {
		const [dataList, dataListTotal] = await prisma.$transaction([
			prisma.invite.findMany({
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
			prisma.invite.count({
				where: {
					...this.mountWhere(options)
				}
			})
		]);

		const invites = InviteEntity.fromList(dataList);
		const items = await Promise.all(invites.items.map(invite => invite.toObject({ sign_files: true })));

		return {
			items,
			total: dataListTotal
		};
	}

	async create(document: { email: string; role: Role; workspaceId: string }) {
		const existsUser = await prisma.user.findFirst({
			where: {
				email: document.email
			}
		});
		if (!existsUser) throw new UserNotFoundError();

		const inviteWithSameEmail = await prisma.invite.findFirst({
			where: {
				email: document.email,
				workspaceId: document.workspaceId
			}
		});
		if (inviteWithSameEmail) throw new InviteWithSameEmailError();

		const invite = await prisma.invite.create({
			data: {
				workspaceId: document.workspaceId,
				email: document.email,
				role: document.role
			}
		});

		const inviteEntity = new InviteEntity(invite);

		return inviteEntity;
	}

	async revoke(document: { inviteId: string; workspaceId: string }) {
		const invite = await prisma.invite.findUnique({
			where: {
				id: document.inviteId,
				workspaceId: document.workspaceId
			}
		});

		if (!invite) throw new InviteNotFoundError();

		await prisma.invite.delete({
			where: {
				id: invite.id
			}
		});
	}
}
