import {
	applyPrismaPagination,
	IntegrationStatus,
	IntegrationType,
	PaginationOptions,
	prisma,
	Prisma
} from '@wppsync/database';

import { Provider } from '@/core/index.js';

import { IntegrationEntity } from '@/entities/data/index.js';
import { IntegrationNotFoundError } from '@/entities/errors/integration/IntegrationNotFoundError.js';

export type IntegrationServiceWhereInput = Prisma.IntegrationWhereInput;

export type IntegrationServiceWhereOptions = {
	id?: string;
	ids?: string[];

	search?: string;
	status?: IntegrationStatus;
	isDeleted?: boolean;

	workspace?: string;

	include?: Prisma.IntegrationInclude;
};

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
		const items = await Promise.all(integrations.items.map(integration => integration.toObject({})));

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

		return integrationEntity;
	}

	async update(
		integration: IntegrationEntity,
		document: {
			name?: string;
			isDeleted?: boolean;
		}
	) {
		integration.addChanges({
			name: document.name,
			isDeleted: document.isDeleted || false
		});

		await integration.save();

		return integration;
	}
}
