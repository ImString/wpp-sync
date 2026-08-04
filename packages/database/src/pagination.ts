export interface PaginationOptions {
	page?: number;
	limit?: number;

	ignore_pagination?: boolean;
	legacy?: boolean;
}

export const applyPrismaPagination = (options: PaginationOptions) => {
	if (options.ignore_pagination) return;

	const page = options.page || (options.legacy ? 0 : 1);
	const limit = options.limit || (options.legacy ? 1 : 15);

	return {
		take: limit,
		skip: options.legacy ? page : (page - 1) * limit
	};
};
