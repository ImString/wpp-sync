import {
	applyPrismaPagination,
	type Integration,
	IntegrationStatus,
	IntegrationType,
	PaginationOptions,
	prisma,
	Prisma
} from '@wppsync/database';

import { Provider } from '@/core/index.js';

import { SocketRooms } from '@/modules/index.js';
import { BullModule, SocketModule } from '@/modules/modules.js';

import { IntegrationEntity } from '@/entities/data/index.js';
import { IntegrationJobDTO } from '@/entities/dtos/jobs/integration.dto.js';
import { IntegrationSocketDTO } from '@/entities/dtos/sockets/integration.dto.js';
import { IntegrationNotFoundError } from '@/entities/errors/integration/IntegrationNotFoundError.js';

export type IntegrationServiceWhereInput = Prisma.IntegrationWhereInput;

export type IntegrationServiceWhereOptions = {
	id?: string;
	ids?: string[];

	search?: string;
	status?: IntegrationStatus;
	type?: IntegrationType;
	isDeleted?: boolean;

	workspace?: string;

	include?: Prisma.IntegrationInclude;
};

export interface IntegrationUpdateDocument {
	name?: string;
	status?: IntegrationStatus;
	isDeleted?: boolean;
	config?: Integration['config'];
}

@Provider()
export class IntegrationService {
	private mountWhere(options: IntegrationServiceWhereOptions): IntegrationServiceWhereInput {
		return {
			...(options.id && { id: options.id }),
			...(options.ids && { id: { in: options.ids } }),

			...(options.search && {
				name: {
					contains: options.search,
					mode: 'insensitive'
				}
			}),
			...(options.status && { status: options.status }),
			...(options.type && { type: options.type }),

			isDeleted: options.isDeleted || false,

			...(options.workspace && {
				workspaceId: options.workspace
			})
		};
	}

	async list(options: IntegrationServiceWhereOptions & PaginationOptions) {
		const [dataList, dataListTotal] = await prisma.$transaction([
			prisma.integration.findMany({
				where: {
					...this.mountWhere(options)
				},
				include: {
					...options.include
				},
				...applyPrismaPagination(options)
			}),
			prisma.integration.count({
				where: {
					...this.mountWhere(options)
				}
			})
		]);

		const integrations = IntegrationEntity.fromList(dataList);
		const items = await Promise.all(
			integrations.items.map(integration => integration.toObject({ sign_files: true }))
		);

		return {
			items,
			total: dataListTotal
		};
	}

	async allCount(options: IntegrationServiceWhereOptions) {
		const groupedCounts = await prisma.integration.groupBy({
			by: ['status'],
			where: {
				...this.mountWhere(options)
			},
			_count: {
				_all: true
			}
		});

		const byStatus: Record<IntegrationStatus, number> = {
			INITIALIZING: 0,
			AWAITING_LOGIN: 0,
			CONNECTED: 0,
			DISCONNECTED: 0
		};

		for (const groupedCount of groupedCounts) {
			byStatus[groupedCount.status] = groupedCount._count._all;
		}

		return {
			total: groupedCounts.reduce((total, groupedCount) => total + groupedCount._count._all, 0),
			byStatus
		};
	}

	async get(options: IntegrationServiceWhereOptions) {
		const data = await prisma.integration.findFirst({
			where: {
				...this.mountWhere(options)
			},
			include: options.include
		});

		if (!data) throw new IntegrationNotFoundError();

		return new IntegrationEntity(data);
	}

	async create(document: { name: string; type: IntegrationType; workspace: string }) {
		const integration = await prisma.integration.create({
			data: {
				name: document.name,
				type: document.type,
				status: 'INITIALIZING',
				workspaceId: document.workspace
			}
		});

		const integrationEntity = new IntegrationEntity(integration);
		const initializationData = { integrationId: integrationEntity.id };

		if (document.type === 'WHATSAPP') {
			BullModule.add(IntegrationJobDTO.WhatsappCreate, initializationData);
		} else if (document.type === 'WEB') {
			BullModule.add(IntegrationJobDTO.WebCreate, initializationData);
		}

		return integrationEntity;
	}

	async update(integration: IntegrationEntity, document: IntegrationUpdateDocument) {
		integration.addChanges({
			...(document.name && { name: document.name }),
			...(document.status && { status: document.status }),
			...(document.config !== undefined && { config: document.config }),
			...(document.isDeleted !== undefined && { isDeleted: document.isDeleted })
		});

		await integration.save();

		const workspaceUID = integration.entities.workspace?.data.uid;

		if (workspaceUID) {
			SocketModule.emitTo(SocketRooms.workspace(workspaceUID), IntegrationSocketDTO.Update, {
				integrationId: integration.id,
				...(document.name && { name: document.name }),
				...(document.status && { status: document.status })
			});
		}

		return integration;
	}
}
