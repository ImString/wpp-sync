import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from './generated/prisma/client.js';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error(
		'DATABASE_URL is not defined. Start the application with dotenvx so the database environment is loaded.'
	);
}

const createPrismaClient = () => {
	const adapter = new PrismaPg({ connectionString });

	return new PrismaClient({ adapter });
};

const globalForPrisma = globalThis as unknown as {
	prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
	globalForPrisma.prisma = prisma;
}
