import { useState } from 'react';
import {
	MdChangeCircle,
	MdKeyboardArrowDown,
	MdLogout,
	MdOutlineChangeCircle,
	MdOutlinePerson,
	MdTune
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';

import { authAPI } from '@/utils/api';

import { Button } from '@/components/buttons';
import { Image } from '@/components/shared/Image';
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
				<div
					className="absolute bottom-[calc(100%-4px)] left-3 right-3 w-50 rounded-[14px] border border-white/10 bg-[#082c27] p-1.75 shadow-xl [&>button]:cursor-pointer [&>button]:flex [&>button]:min-h-9.5 [&>button]:w-full [&>button]:items-center [&>button]:gap-2.25 [&>button]:rounded-[9px] [&>button]:bg-transparent [&>button]:px-2.75 [&>button]:text-left [&>button]:text-xs [&>button]:transition [&>button:hover]:bg-[#0b3f38] [&_svg]:size-4.25 [&_svg]:text-(--workspace-muted) [&>hr]:my-1.5 [&>hr]:border-0 [&>hr]:border-t [&>hr]:border-white/10"
					role="menu">
					<button type="button" role="menuitem" onClick={() => navigate('/profile?context=workspace')}>
						<MdOutlinePerson aria-hidden="true" />
						Minha conta
					</button>
					<hr />
					<button type="button" role="menuitem" onClick={() => navigate('/')}>
						<MdOutlineChangeCircle aria-hidden="true" />
						Áreas de Trabalho
					</button>
					<hr />
					<button type="button" role="menuitem" onClick={handleLogout}>
						<MdLogout aria-hidden="true" />
						Sair
					</button>
				</div>
			)}

			<Button
				theme="unstyled"
				type="button"
				aria-expanded={menuOpen}
				aria-haspopup="menu"
				className="flex min-h-14.5 w-full items-center justify-start gap-2.5 rounded-xl p-2 text-left text-emerald-50 transition hover:bg-white/5"
				onClick={() => setMenuOpen(isOpen => !isOpen)}>
				<Image
					className="inline-grid w-10 h-10 flex-0 place-items-center rounded-full"
					src={currentUser?.avatarUrl || undefined}
					seed={currentUser?.name}
					collection="initials"
				/>
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
