import { forwardRef } from 'react';

interface LoadingProps {
	label?: string;
}

export const Loading = forwardRef<HTMLDivElement, LoadingProps>((props, ref) => {
	return (
		<div
			ref={ref}
			className="fixed inset-0 z-50 grid min-h-dvh w-full place-items-center bg-white text-slate-900 dark:bg-[#081116] dark:text-slate-100"
			role="status"
			aria-live="polite">
			<div className="flex flex-col items-center gap-5 px-6 text-center">
				<div className="relative grid size-18 place-items-center" aria-hidden="true">
					<span className="absolute inset-0 animate-spin rounded-full border-4 border-brand-100 border-t-brand-500 dark:border-[#17382a] dark:border-t-brand-400" />
					<span className="size-7 rounded-full bg-brand-500/15 shadow-[0_0_24px_rgba(37,211,102,.35)]" />
				</div>

				<div>
					<strong className="text-xl font-bold tracking-tighter">
						<span className="text-brand-500">Wpp</span>Sync
					</strong>
					<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
						{props.label || 'Validando sua sessão...'}
					</p>
				</div>
			</div>
		</div>
	);
});

Loading.displayName = 'Loading';
