import { MdClose } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import { useShallow } from 'zustand/react/shallow';

import { Brand } from '@/components/brand';
import { Button } from '@/components/buttons';
import { useWorkspaceStore } from '@/stores';

import { useChatStore } from '../store';
import { SidebarNavigation } from './Navigation';
import { SidebarUser } from './User';

export const Sidebar: React.FC = () => {
	const { sidebarOpen, closeSidebar } = useChatStore(
		useShallow(state => ({
			sidebarOpen: state.sidebarOpen,
			closeSidebar: state.closeSidebar
		}))
	);
	const activeWorkspace = useWorkspaceStore(state =>
		state.workspaces.find(workspace => workspace.uid === state.activeWorkspaceUid)
	);

	return (
		<aside
			aria-label="Navegação principal"
			className={twMerge(
				'sidebar-drawer fixed inset-y-0 left-0 z-40 flex w-[min(290px,86vw)] translate-x-[-105%] flex-col overflow-hidden rounded-r-2xl border border-white/5 bg-[radial-gradient(circle_at_0_0,rgba(37,211,102,.15),transparent_38%),linear-gradient(180deg,#073b32,#041f1b)] text-emerald-50 shadow-app transition-transform duration-200 drawer:static drawer:w-auto drawer:translate-x-0 drawer:rounded-l-2xl drawer:rounded-r-none',
				sidebarOpen && 'is-open'
			)}>
			<header className="flex h-18 shrink-0 items-center justify-between gap-2 px-4.5">
				<div className="flex min-w-0 flex-col gap-0.5">
					<Brand />
					<Link
						to="/"
						className="truncate pl-11 text-[9px] font-medium text-emerald-100/55 transition hover:text-emerald-100"
						title="Trocar área de trabalho">
						{activeWorkspace?.name || 'Trocar área de trabalho'}
					</Link>
				</div>
				<Button
					theme="ghost"
					type="button"
					aria-label="Fechar menu"
					className="size-10 min-h-10 rounded-xl p-0 text-emerald-100 hover:bg-white/10 hover:text-white drawer:hidden"
					onClick={closeSidebar}>
					<MdClose className="size-5" aria-hidden="true" />
				</Button>
			</header>

			<SidebarNavigation />
			<SidebarUser />
		</aside>
	);
};
