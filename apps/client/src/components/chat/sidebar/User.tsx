import { useState } from 'react';
import { MdKeyboardArrowDown, MdLogout } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';

import { authAPI } from '@/utils/api';

import { Button } from '@/components/buttons';
import { useAuthenticationStore } from '@/stores';

const getInitials = (name?: string) => {
	return (name || 'Usuário')
		.split(' ')
		.slice(0, 2)
		.map(part => part.charAt(0))
		.join('')
		.toUpperCase();
};

const getRoleLabel = (role?: string) => {
	if (role === 'ADMIN') return 'Administrador';
	if (role === 'AGENT') return 'Atendente';
	return role || 'Usuário';
};

export const SidebarUser: React.FC = () => {
	const [menuOpen, setMenuOpen] = useState(false);
	const navigate = useNavigate();
	const authToken = useAuthenticationStore(state => state.authToken);
	const refreshToken = useAuthenticationStore(state => state.refreshToken);
	const currentUser = useAuthenticationStore(state => state.currentUser);
	const clearAuthentication = useAuthenticationStore(state => state.clearAuthentication);

	const handleLogout = () => {
		void authAPI.logout(refreshToken, authToken).catch(() => undefined);
		clearAuthentication();
		navigate('/auth/login', { replace: true });
	};

	return (
		<footer className="relative border-t border-white/10 p-3">
			{menuOpen && (
				<div className="absolute bottom-[calc(100%-4px)] left-3 right-3 rounded-xl border border-white/10 bg-[#082c27] p-1.5 shadow-xl">
					<Button
						theme="unstyled"
						type="button"
						className="flex min-h-10 w-full items-center justify-start gap-2 rounded-lg px-3 text-xs font-semibold text-red-200 transition hover:bg-red-400/10 hover:text-red-100"
						onClick={handleLogout}>
						<MdLogout className="size-4" aria-hidden="true" />
						Sair da conta
					</Button>
				</div>
			)}

			<Button
				theme="unstyled"
				type="button"
				aria-expanded={menuOpen}
				aria-haspopup="menu"
				className="flex min-h-14.5 w-full items-center justify-start gap-2.5 rounded-xl p-2 text-left text-emerald-50 transition hover:bg-white/5"
				onClick={() => setMenuOpen(isOpen => !isOpen)}>
				<span className="avatar bg-linear-to-br from-amber-700 to-slate-700">
					{getInitials(currentUser?.name)}
				</span>
				<span className="flex min-w-0 flex-1 flex-col">
					<strong className="truncate text-[13px] text-white">{currentUser?.name || 'Usuário'}</strong>
					<small className="truncate text-[10px] text-emerald-100/60">
						{getRoleLabel(currentUser?.role)}
					</small>
				</span>
				<MdKeyboardArrowDown
					className={twMerge('size-4.5 transition-transform', menuOpen && 'rotate-180')}
					aria-hidden="true"
				/>
			</Button>
		</footer>
	);
};
