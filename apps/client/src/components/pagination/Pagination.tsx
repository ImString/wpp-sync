import { MdChevronLeft, MdChevronRight } from 'react-icons/md';
import { twMerge } from 'tailwind-merge';

import { Button } from '@/components/buttons';

type PageItem = number | 'start-ellipsis' | 'end-ellipsis';

interface PaginationProps {
	page: number;
	pageSize: number;
	totalItems: number;
	itemLabel?: string;
	singularItemLabel?: string;
	pageSizeOptions?: number[];
	className?: string;
	disabled?: boolean;
	onPageChange: (page: number) => void;
	onPageSizeChange: (pageSize: number) => void;
}

const getPageItems = (page: number, totalPages: number): PageItem[] => {
	if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
	if (page <= 3) return [1, 2, 3, 4, 'end-ellipsis', totalPages];
	if (page >= totalPages - 2)
		return [1, 'start-ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
	return [1, 'start-ellipsis', page - 1, page, page + 1, 'end-ellipsis', totalPages];
};

export const Pagination: React.FC<PaginationProps> = props => {
	if (props.totalItems <= 0) return null;

	const totalPages = Math.max(1, Math.ceil(props.totalItems / props.pageSize));
	const currentPage = Math.min(Math.max(props.page, 1), totalPages);
	const start = (currentPage - 1) * props.pageSize + 1;
	const end = Math.min(currentPage * props.pageSize, props.totalItems);
	const pageItems = getPageItems(currentPage, totalPages);
	const pageSizeOptions = props.pageSizeOptions || [5, 10, 20];
	const itemLabel = props.totalItems === 1 ? props.singularItemLabel || props.itemLabel : props.itemLabel;

	return (
		<footer
			className={twMerge(
				'flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-3 py-3 dark:border-[#223138] dark:bg-[#0e181e] mobile:px-4',
				props.className
			)}>
			<p className="text-[9px] font-medium text-slate-500 dark:text-slate-400">
				Exibindo{' '}
				<strong className="text-slate-700 dark:text-slate-200">
					{start}–{end}
				</strong>{' '}
				de <strong className="text-slate-700 dark:text-slate-200">{props.totalItems}</strong>{' '}
				{itemLabel || 'itens'}
			</p>

			<nav
				className="order-3 flex w-full items-center justify-center gap-1 mobile:order-0 mobile:w-auto"
				aria-label="Paginação">
				<Button
					theme="ghost"
					type="button"
					className="size-8 min-h-8 rounded-lg p-0"
					aria-label="Página anterior"
					disabled={props.disabled || currentPage === 1}
					onClick={() => props.onPageChange(currentPage - 1)}>
					<MdChevronLeft className="size-4" aria-hidden="true" />
				</Button>

				{pageItems.map(item =>
					typeof item === 'number' ? (
						<Button
							key={item}
							theme="ghost"
							type="button"
							className={twMerge(
								'size-8 min-h-8 rounded-lg p-0 text-[10px]',
								item === currentPage &&
									'bg-brand-50 text-brand-700 dark:bg-[#0f3826] dark:text-brand-400'
							)}
							aria-label={`Ir para página ${item}`}
							aria-current={item === currentPage ? 'page' : undefined}
							disabled={props.disabled}
							onClick={() => props.onPageChange(item)}>
							{item}
						</Button>
					) : (
						<span
							key={item}
							className="grid size-6 place-items-center text-[10px] text-slate-400"
							aria-hidden="true">
							…
						</span>
					)
				)}

				<Button
					theme="ghost"
					type="button"
					className="size-8 min-h-8 rounded-lg p-0"
					aria-label="Próxima página"
					disabled={props.disabled || currentPage === totalPages}
					onClick={() => props.onPageChange(currentPage + 1)}>
					<MdChevronRight className="size-4" aria-hidden="true" />
				</Button>
			</nav>

			<label className="flex items-center gap-2 text-[9px] font-medium text-slate-500 dark:text-slate-400">
				<span className="hidden wide:inline">Por página</span>
				<select
					value={props.pageSize}
					disabled={props.disabled}
					onChange={event => props.onPageSizeChange(Number(event.target.value))}
					aria-label="Itens por página"
					className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2 text-[9px] font-semibold text-slate-600 outline-none focus:border-brand-500 dark:border-[#2a3a42] dark:bg-[#131f26] dark:text-slate-300">
					{pageSizeOptions.map(option => (
						<option key={option} value={option}>
							{option} / pág.
						</option>
					))}
				</select>
			</label>
		</footer>
	);
};
