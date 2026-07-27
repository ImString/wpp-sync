import type { MultipartFile } from '@fastify/multipart';
import { type Prisma, prisma } from '@wppsync/database';
import { Slug } from '@wppsync/shared';
import sharp from 'sharp';
import Sqids from 'sqids';

import { Provider } from '@/core/index.js';

import { MemberEntity } from '@/entities/data/workspaces/members.entity.js';
import { WorkspaceEntity } from '@/entities/data/workspaces/workspace.entity.js';
import type { WorkspaceDTO } from '@/entities/dtos/workspace.dto.js';
import { WorkspaceNotFoundError } from '@/entities/errors/workspace/index.js';

import { FilesService } from './FilesService.js';

export type WorkspaceServiceWhereInput = Prisma.WorkspaceWhereInput;
export type WorkspaceServiceWhereOptions = {
	id?: string;

	search?: string;
	userId?: string;

	include?: Prisma.WorkspaceInclude;
};

@Provider()
export class WorkspaceService {
	private mountWhere(options: WorkspaceServiceWhereOptions): WorkspaceServiceWhereInput {
		return {
			...(options.id && { id: options.id }),
			...(options.search && {
				name: {
					contains: options.search,
					mode: 'insensitive'
				}
			}),
			...(options.userId && {
				members: {
					some: {
						userId: options.userId
					}
				}
			}),
			disabled: {
				equals: false
			}
		};
	}

	async list(options: WorkspaceServiceWhereOptions) {
		const [dataList, dataListTotal] = await prisma.$transaction([
			prisma.workspace.findMany({
				where: {
					...this.mountWhere(options)
				},
				include: {
					...options.include,
					avatar: true
				},
				orderBy: {
					createdAt: 'desc'
				}
			}),
			prisma.workspace.count({
				where: {
					...this.mountWhere(options)
				}
			})
		]);

		const workspaces = WorkspaceEntity.fromList(dataList);
		const items = await Promise.all(workspaces.items.map(workspace => workspace.toObject({ sign_files: true })));

		return {
			items,
			total: dataListTotal
		};
	}

	async get(options: WorkspaceServiceWhereOptions): Promise<WorkspaceEntity> {
		const data = await prisma.workspace.findFirst({
			where: {
				...this.mountWhere(options)
			},
			include: options.include
		});

		if (!data) throw new WorkspaceNotFoundError();

		const workspaceEntity = new WorkspaceEntity(data);

		return workspaceEntity;
	}

	async getUserMembership(userId: string, uid: string) {
		const data = await prisma.workspace.findFirst({
			where: {
				uid,
				disabled: false,
				members: {
					some: {
						userId,
						disabled: false
					}
				}
			},
			include: {
				avatar: true,
				owner: true,
				members: {
					where: {
						userId,
						disabled: false
					},
					include: {
						user: {
							include: {
								avatar: true
							}
						}
					},
					take: 1
				}
			}
		});

		const membershipData = data?.members[0];

		if (!data || !membershipData) throw new WorkspaceNotFoundError();

		const { members: _members, ...workspaceData } = data;

		return {
			workspace: new WorkspaceEntity(workspaceData),
			membership: new MemberEntity(membershipData)
		};
	}

	async create(userId: string, document: WorkspaceDTO.CreateDocument, avatar?: MultipartFile) {
		const sqids = new Sqids();
		const uid = sqids.encode([Date.now(), Math.floor(Math.random() * 1000)]);
		let uploadedAvatar;

		if (avatar) {
			const avatarBuffer = await sharp(await avatar.toBuffer())
				.resize(512, 512, {
					fit: 'contain',
					background: { r: 255, g: 255, b: 255, alpha: 0 }
				})
				.webp()
				.toBuffer();

			uploadedAvatar = await FilesService.upload({
				buffer: avatarBuffer,
				name: avatar.filename.replace(/\.[^/.]+$/, '') + '.webp',
				mime_type: 'image/webp',
				prefix: `workspaces/${uid}/avatars`
			});
		}

		let workspaceCreated;

		try {
			workspaceCreated = await prisma.workspace.create({
				data: {
					uid,
					name: document.name,
					slug: Slug.createSlug(document.name),
					owner: {
						connect: { id: userId }
					},
					...(uploadedAvatar && {
						avatar: {
							connect: { id: uploadedAvatar.id }
						}
					}),
					members: {
						create: {
							role: 'ADMIN',
							user: {
								connect: { id: userId }
							}
						}
					}
				},
				include: {
					avatar: true,
					owner: true
				}
			});
		} catch (error) {
			if (uploadedAvatar) await uploadedAvatar.delete().catch(() => undefined);
			throw error;
		}

		return new WorkspaceEntity(workspaceCreated).toObject({ sign_files: true });
	}
}
