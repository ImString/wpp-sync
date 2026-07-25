import type { InputHTMLAttributes } from 'react';
import { MdSearch } from 'react-icons/md';
import { twMerge } from 'tailwind-merge';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
	containerClassName?: string;
	shortcut?: string;
}

export const SearchInput: React.FC<SearchInputProps> = props => {
	const { containerClassName, className, shortcut, ...inputProps } = props;

	return (
		<label
			className={twMerge(
				'flex h-10 min-w-0 items-center gap-2 rounded-xl border border-transparent bg-slate-100 px-3 text-slate-500 transition focus-within:border-brand-500 focus-within:bg-white dark:bg-[#131f26] dark:text-slate-400 dark:focus-within:bg-[#0e181e]',
				containerClassName
			)}>
			<MdSearch className="size-4.5 shrink-0" aria-hidden="true" />
			<input
				{...inputProps}
				type="search"
				className={twMerge(
					'min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100',
					className
				)}
			/>
			{shortcut && (
				<kbd className="hidden rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-400 mobile:block dark:border-[#223138] dark:bg-[#0e181e]">
					{shortcut}
				</kbd>
			)}
		</label>
	);
};
