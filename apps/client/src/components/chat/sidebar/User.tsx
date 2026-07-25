import { MdKeyboardArrowDown } from 'react-icons/md';

import { Button } from '@/components/buttons';

export const SidebarUser: React.FC = () => {
	return (
		<footer className="border-t border-white/10 p-3">
			<Button
				theme="unstyled"
				type="button"
				className="flex min-h-14.5 w-full items-center justify-start gap-2.5 rounded-xl p-2 text-left text-emerald-50 transition hover:bg-white/5">
				<span className="avatar bg-linear-to-br from-amber-700 to-slate-700">FS</span>
				<span className="flex min-w-0 flex-1 flex-col">
					<strong className="truncate text-[13px] text-white">Felipe Santos</strong>
					<small className="truncate text-[10px] text-emerald-100/60">Administrador</small>
				</span>
				<MdKeyboardArrowDown className="size-4.5" aria-hidden="true" />
			</Button>
		</footer>
	);
};
