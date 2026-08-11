import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

interface UseInfiniteScrollOptions<Element extends HTMLElement> {
	rootRef: RefObject<Element | null>;
	hasMore: boolean;
	isLoading: boolean;
	onLoadMore: () => void | Promise<void>;
	enabled?: boolean;
	rootMargin?: string;
}

export const useInfiniteScroll = <Element extends HTMLElement = HTMLDivElement>(
	options: UseInfiniteScrollOptions<Element>
) => {
	const sentinelRef = useRef<HTMLDivElement>(null);
	const hasMoreRef = useRef(options.hasMore);
	const isLoadingRef = useRef(options.isLoading);
	const onLoadMoreRef = useRef(options.onLoadMore);
	const requestRunningRef = useRef(false);

	useEffect(() => {
		hasMoreRef.current = options.hasMore;
	}, [options.hasMore]);

	useEffect(() => {
		isLoadingRef.current = options.isLoading;
	}, [options.isLoading]);

	useEffect(() => {
		onLoadMoreRef.current = options.onLoadMore;
	}, [options.onLoadMore]);

	useEffect(() => {
		const root = options.rootRef.current;
		const sentinel = sentinelRef.current;

		if (options.enabled === false || !root || !sentinel) return;

		const observer = new IntersectionObserver(
			entries => {
				if (!entries[0]?.isIntersecting) return;
				if (!hasMoreRef.current || isLoadingRef.current || requestRunningRef.current) return;

				requestRunningRef.current = true;
				void Promise.resolve(onLoadMoreRef.current()).finally(() => {
					requestRunningRef.current = false;
				});
			},
			{
				root,
				rootMargin: options.rootMargin || '120px 0px',
				threshold: 0
			}
		);

		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [options.enabled, options.rootMargin, options.rootRef]);

	return { sentinelRef };
};
