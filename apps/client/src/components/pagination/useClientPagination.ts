import { useCallback, useEffect, useMemo, useState } from 'react';

export const useClientPagination = <Item>(items: Item[], initialPageSize = 5) => {
	const [page, setPageState] = useState(1);
	const [pageSize, setPageSizeState] = useState(initialPageSize);
	const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
	const currentPage = Math.min(page, totalPages);

	useEffect(() => {
		setPageState(current => Math.min(current, totalPages));
	}, [totalPages]);

	const pageItems = useMemo(() => {
		const start = (currentPage - 1) * pageSize;
		return items.slice(start, start + pageSize);
	}, [currentPage, items, pageSize]);

	const setPage = useCallback(
		(nextPage: number) => setPageState(Math.min(Math.max(nextPage, 1), totalPages)),
		[totalPages]
	);
	const setPageSize = useCallback((nextPageSize: number) => {
		setPageSizeState(nextPageSize);
		setPageState(1);
	}, []);
	const resetPage = useCallback(() => setPageState(1), []);

	return {
		page: currentPage,
		pageSize,
		pageItems,
		totalItems: items.length,
		totalPages,
		setPage,
		setPageSize,
		resetPage
	};
};
