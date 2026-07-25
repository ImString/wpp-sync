import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { MdAutorenew } from 'react-icons/md';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	theme?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'unstyled';
	loading?: boolean;
	loadingLabel?: string;
	children?: ReactNode;
}

export const Button: React.FC<ButtonProps> = props => {
	const { theme = 'primary', loading, loadingLabel, className, children, disabled, ...buttonProps } = props;

	return (
		<button
			{...buttonProps}
			className={twMerge(
				'cursor-pointer inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold outline-none transition duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60',
				theme === 'primary' && 'bg-brand-600 text-white shadow-sm hover:bg-brand-500',
				theme === 'secondary' &&
					'border border-slate-200 bg-white text-slate-800 hover:bg-slate-100 dark:border-[#223138] dark:bg-[#131f26] dark:text-slate-100 dark:hover:bg-[#17262e]',
				theme === 'ghost' &&
					'bg-transparent text-slate-500 shadow-none hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-[#17262e] dark:hover:text-slate-100',
				theme === 'danger' && 'bg-red-600 text-white hover:bg-red-500',
				theme === 'unstyled' && 'min-h-0 rounded-none p-0 font-normal shadow-none',
				className
			)}
			disabled={disabled || loading}>
			{loading && <MdAutorenew className="animate-spin text-lg" aria-hidden="true" />}
			{loading ? loadingLabel || 'Processando...' : children}
		</button>
	);
};
