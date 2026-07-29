import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
	MdAdminPanelSettings,
	MdCheck,
	MdClose,
	MdDeleteOutline,
	MdEmail,
	MdMailOutline,
	MdMoreHoriz,
	MdOutlineGroupAdd,
	MdSearch,
	MdSwapHoriz
} from 'react-icons/md';

import { Button } from '@/components/buttons';
import { Image } from '@/components/shared/Image';
import type { AuthUser, Workspace } from '@/stores';

import type { SettingsFeedback } from './types';

interface MembersSettingsProps {
	currentUser: AuthUser | null;
	workspace?: Workspace;
	onFeedback: (feedback: SettingsFeedback) => void;
}

type MemberRole = 'Proprietário' | 'Administrador' | 'Membro';

interface MemberRow {
	id: string;
	name: string;
	email: string;
	role: MemberRole;
	avatarUrl?: string | null;
}

interface PendingInvite {
	id: string;
	email: string;
	role: Exclude<MemberRole, 'Proprietário'>;
	sentAt: string;
}

interface DialogProps {
	title: string;
	description?: string;
	onClose: () => void;
	children: ReactNode;
	className?: string;
}

const SettingsDialog: React.FC<DialogProps> = ({ title, description, onClose, children, className = '' }) => {
	useEffect(() => {
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', closeOnEscape);
		return () => window.removeEventListener('keydown', closeOnEscape);
	}, [onClose]);

	return (
		<div
			className="fixed inset-0 z-80 grid place-items-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-[3px]"
			role="presentation"
			onMouseDown={event => {
				if (event.target === event.currentTarget) onClose();
			}}>
			<section
				className={`w-full overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_28px_90px_rgba(2,6,23,.32)] dark:border-[#2a3a42] dark:bg-[#0e181e] ${className}`}
				role="dialog"
				aria-modal="true"
				aria-labelledby="settings-dialog-title">
				<header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4.5 dark:border-[#223138] mobile:px-6">
					<div>
						<h2
							id="settings-dialog-title"
							className="m-0 text-base font-bold text-slate-950 dark:text-white">
							{title}
						</h2>
						{description && (
							<p className="mt-1 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
								{description}
							</p>
						)}
					</div>
					<Button
						theme="ghost"
						type="button"
						className="size-9 min-h-9 shrink-0 p-0 text-lg"
						aria-label="Fechar"
						onClick={onClose}>
						<MdClose aria-hidden="true" />
					</Button>
				</header>
				{children}
			</section>
		</div>
	);
};

const createInitialMembers = (currentUser: AuthUser | null, workspace?: Workspace): MemberRow[] => {
	const owner = workspace?.owner;
	const ownerRow: MemberRow = {
		id: owner?.id || currentUser?.id || 'current-owner',
		name: owner?.name || currentUser?.name || 'Você',
		email: owner?.email || currentUser?.email || 'usuario@empresa.com',
		avatarUrl: owner?.avatarUrl || currentUser?.avatarUrl,
		role: 'Proprietário'
	};
	const rows = [ownerRow];

	if (currentUser && currentUser.id !== ownerRow.id) {
		rows.push({
			id: currentUser.id,
			name: currentUser.name,
			email: currentUser.email,
			avatarUrl: currentUser.avatarUrl,
			role: 'Administrador'
		});
	}

	rows.push(
		{ id: 'demo-member-ana', name: 'Ana Martins', email: 'ana@empresa.com', role: 'Administrador' },
		{ id: 'demo-member-rafael', name: 'Rafael Costa', email: 'rafael@empresa.com', role: 'Membro' }
	);

	return rows;
};

export const MembersSettings: React.FC<MembersSettingsProps> = ({ currentUser, workspace, onFeedback }) => {
	const [members, setMembers] = useState<MemberRow[]>(() => createInitialMembers(currentUser, workspace));
	const [search, setSearch] = useState('');
	const [openMenuId, setOpenMenuId] = useState<string | null>(null);
	const [invitesOpen, setInvitesOpen] = useState(false);
	const [inviteView, setInviteView] = useState<'new' | 'pending'>('new');
	const [inviteEmail, setInviteEmail] = useState('');
	const [inviteRole, setInviteRole] = useState<PendingInvite['role']>('Membro');
	const [inviteError, setInviteError] = useState('');
	const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([
		{ id: 'invite-mariana', email: 'mariana@empresa.com', role: 'Membro', sentAt: 'Hoje, 10:24' },
		{ id: 'invite-gustavo', email: 'gustavo@empresa.com', role: 'Administrador', sentAt: 'Ontem, 16:08' }
	]);
	const [action, setAction] = useState<{ type: 'remove' | 'transfer'; member: MemberRow } | null>(null);

	useEffect(() => {
		setMembers(createInitialMembers(currentUser, workspace));
	}, [currentUser?.id, workspace?.uid]);

	const filteredMembers = useMemo(() => {
		const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR');
		if (!normalizedSearch) return members;
		return members.filter(member =>
			`${member.name} ${member.email} ${member.role}`.toLocaleLowerCase('pt-BR').includes(normalizedSearch)
		);
	}, [members, search]);

	const handleInvite = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const normalizedEmail = inviteEmail.trim().toLowerCase();

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
			setInviteError('Informe um e-mail válido.');
			return;
		}

		if (
			pendingInvites.some(invite => invite.email === normalizedEmail) ||
			members.some(member => member.email === normalizedEmail)
		) {
			setInviteError('Este e-mail já é membro ou possui um convite pendente.');
			return;
		}

		setPendingInvites(current => [
			{ id: `invite-${Date.now()}`, email: normalizedEmail, role: inviteRole, sentAt: 'Agora' },
			...current
		]);
		setInviteEmail('');
		setInviteError('');
		setInviteView('pending');
		onFeedback({ type: 'success', message: `Convite preparado para ${normalizedEmail}.` });
	};

	const revokeInvite = (invite: PendingInvite) => {
		setPendingInvites(current => current.filter(item => item.id !== invite.id));
		onFeedback({ type: 'info', message: `Convite de ${invite.email} revogado nesta prévia.` });
	};

	const confirmAction = () => {
		if (!action) return;

		if (action.type === 'remove') {
			setMembers(current => current.filter(member => member.id !== action.member.id));
			onFeedback({ type: 'success', message: `${action.member.name} foi removido da lista.` });
		} else {
			setMembers(current =>
				current.map(member => ({
					...member,
					role:
						member.id === action.member.id
							? 'Proprietário'
							: member.role === 'Proprietário'
								? 'Administrador'
								: member.role
				}))
			);
			onFeedback({ type: 'success', message: `A posse foi transferida para ${action.member.name}.` });
		}

		setAction(null);
		setOpenMenuId(null);
	};

	return (
		<>
			<section className="overflow-visible rounded-[20px] border border-slate-200 bg-white shadow-panel dark:border-[#223138] dark:bg-[#0e181e]">
				<header className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4.5 dark:border-[#223138] mobile:flex-row mobile:items-center mobile:justify-between mobile:px-6">
					<div>
						<h2 className="m-0 text-sm font-bold text-slate-900 dark:text-white">Membros da equipe</h2>
						<p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
							{members.length} {members.length === 1 ? 'pessoa possui' : 'pessoas possuem'} acesso a esta
							área.
						</p>
					</div>
					<Button
						theme="primary"
						type="button"
						className="min-h-10 self-start px-3 text-[10px] mobile:self-auto"
						onClick={() => setInvitesOpen(true)}>
						<MdOutlineGroupAdd className="size-4.5" aria-hidden="true" />
						Convites
						{pendingInvites.length > 0 && (
							<span className="grid min-w-4.5 place-items-center rounded-full bg-white/20 px-1 text-[9px]">
								{pendingInvites.length}
							</span>
						)}
					</Button>
				</header>

				<div className="flex items-center justify-between gap-3 px-5 py-4 mobile:px-6">
					<label className="flex h-10 w-full max-w-72 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-400 transition focus-within:border-brand-500 focus-within:bg-white dark:border-[#2a3a42] dark:bg-[#131f26] dark:focus-within:bg-[#0e181e]">
						<MdSearch className="size-4.5 shrink-0" aria-hidden="true" />
						<span className="sr-only">Buscar membro</span>
						<input
							className="min-w-0 flex-1 border-0 bg-transparent text-[11px] text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
							type="search"
							placeholder="Buscar por nome ou e-mail..."
							value={search}
							onChange={event => setSearch(event.target.value)}
						/>
					</label>
				</div>

				<div className="px-3 pb-4 mobile:px-6 mobile:pb-6">
					<div>
						<div className="hidden grid-cols-[minmax(230px,1.6fr)_minmax(170px,1fr)_100px_44px] gap-3 border-b border-slate-200 px-3 py-2 text-[9px] font-bold uppercase tracking-[.08em] text-slate-400 dark:border-[#223138] mobile:grid">
							<span>Membro</span>
							<span>Função</span>
							<span>Status</span>
							<span className="sr-only">Ações</span>
						</div>

						{filteredMembers.length > 0 ? (
							filteredMembers.map(member => (
								<div
									key={member.id}
									className="relative grid min-h-18 grid-cols-[minmax(0,1fr)_44px] items-center gap-3 border-b border-slate-100 px-3 last:border-0 dark:border-[#1b2a31] mobile:min-h-17 mobile:grid-cols-[minmax(230px,1.6fr)_minmax(170px,1fr)_100px_44px]">
									<div className="flex min-w-0 items-center gap-3">
										<Image
											className="size-9.5 shrink-0 rounded-full object-cover"
											src={member.avatarUrl || undefined}
											seed={member.name}
											collection="initials"
										/>
										<div className="min-w-0">
											<strong className="block truncate text-[11px] text-slate-900 dark:text-white">
												{member.name}
												{member.id === currentUser?.id && (
													<span className="ml-1 font-normal text-slate-400">(você)</span>
												)}
											</strong>
											<span className="mt-0.5 block truncate text-[9px] text-slate-500 dark:text-slate-400">
												{member.email}
											</span>
											<span className="mt-1 flex items-center gap-1.5 text-[9px] font-medium text-slate-500 dark:text-slate-400 mobile:hidden">
												<MdAdminPanelSettings
													className={
														member.role === 'Proprietário'
															? 'text-brand-600 dark:text-brand-400'
															: ''
													}
													aria-hidden="true"
												/>
												{member.role}
												<span className="size-1 rounded-full bg-emerald-500" />
												Ativo
											</span>
										</div>
									</div>
									<span className="hidden items-center gap-1.5 text-[10px] font-medium text-slate-600 dark:text-slate-300 mobile:flex">
										<MdAdminPanelSettings
											className={`size-4 ${member.role === 'Proprietário' ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`}
											aria-hidden="true"
										/>
										{member.role}
									</span>
									<span className="hidden w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 mobile:inline-flex">
										<span className="size-1.5 rounded-full bg-emerald-500" />
										Ativo
									</span>
									<div className="relative">
										{member.role !== 'Proprietário' ? (
											<Button
												theme="ghost"
												type="button"
												className="size-9 min-h-9 p-0 text-lg"
												aria-label={`Ações de ${member.name}`}
												aria-expanded={openMenuId === member.id}
												onClick={() =>
													setOpenMenuId(current => (current === member.id ? null : member.id))
												}>
												<MdMoreHoriz aria-hidden="true" />
											</Button>
										) : (
											<span className="block size-9" />
										)}
										{openMenuId === member.id && (
											<div className="absolute right-0 top-[calc(100%+4px)] z-20 w-47 rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_14px_36px_rgba(15,23,42,.16)] dark:border-[#2a3a42] dark:bg-[#131f26]">
												<button
													className="flex min-h-9 w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 text-left text-[10px] font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-[#17262e]"
													type="button"
													onClick={() => setAction({ type: 'transfer', member })}>
													<MdSwapHoriz
														className="size-4 text-brand-600 dark:text-brand-400"
														aria-hidden="true"
													/>
													Transferir posse
												</button>
												<button
													className="flex min-h-9 w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 text-left text-[10px] font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
													type="button"
													onClick={() => setAction({ type: 'remove', member })}>
													<MdDeleteOutline className="size-4" aria-hidden="true" />
													Remover membro
												</button>
											</div>
										)}
									</div>
								</div>
							))
						) : (
							<div className="grid min-h-40 place-items-center text-center">
								<div>
									<MdSearch className="mx-auto size-6 text-slate-300" aria-hidden="true" />
									<strong className="mt-2 block text-xs text-slate-700 dark:text-slate-200">
										Nenhum membro encontrado
									</strong>
									<p className="mt-1 text-[10px] text-slate-400">Tente buscar com outro termo.</p>
								</div>
							</div>
						)}
					</div>
				</div>
			</section>

			{invitesOpen && (
				<SettingsDialog
					title="Gerenciar convites"
					description="Convide novas pessoas por e-mail ou revogue acessos ainda não aceitos."
					onClose={() => setInvitesOpen(false)}
					className="max-w-152.5">
					<div className="flex gap-1 border-b border-slate-200 px-5 pt-3 dark:border-[#223138] mobile:px-6">
						<button
							className={`cursor-pointer border-b-2 px-3 py-3 text-[11px] font-semibold transition ${inviteView === 'new' ? 'border-brand-600 text-brand-700 dark:text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
							type="button"
							onClick={() => setInviteView('new')}>
							Convidar por e-mail
						</button>
						<button
							className={`cursor-pointer border-b-2 px-3 py-3 text-[11px] font-semibold transition ${inviteView === 'pending' ? 'border-brand-600 text-brand-700 dark:text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
							type="button"
							onClick={() => setInviteView('pending')}>
							Pendentes ({pendingInvites.length})
						</button>
					</div>

					{inviteView === 'new' ? (
						<form onSubmit={handleInvite}>
							<div className="grid gap-4 px-5 py-5 mobile:grid-cols-[minmax(0,1fr)_160px] mobile:px-6 mobile:py-6">
								<label className="grid gap-1.5 text-[10px] font-semibold text-slate-700 dark:text-slate-200">
									<span>E-mail</span>
									<span className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 focus-within:border-brand-500 focus-within:bg-white dark:border-[#2a3a42] dark:bg-[#131f26] dark:focus-within:bg-[#0e181e]">
										<MdEmail className="mx-3 size-4.5 shrink-0" aria-hidden="true" />
										<input
											className="h-full min-w-0 flex-1 border-0 bg-transparent pr-3 text-xs font-normal text-slate-900 outline-none dark:text-white"
											type="email"
											placeholder="nome@empresa.com"
											value={inviteEmail}
											onChange={event => {
												setInviteEmail(event.target.value);
												setInviteError('');
											}}
										/>
									</span>
									<span className="min-h-3 text-[9px] font-medium text-red-600 dark:text-red-400">
										{inviteError}
									</span>
								</label>
								<label className="grid content-start gap-1.5 text-[10px] font-semibold text-slate-700 dark:text-slate-200">
									<span>Função</span>
									<select
										className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-normal text-slate-900 outline-none focus:border-brand-500 dark:border-[#2a3a42] dark:bg-[#131f26] dark:text-white"
										value={inviteRole}
										onChange={event => setInviteRole(event.target.value as PendingInvite['role'])}>
										<option>Membro</option>
										<option>Administrador</option>
									</select>
								</label>
							</div>
							<footer className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50/70 px-5 py-4 dark:border-[#223138] dark:bg-[#101b21] mobile:px-6">
								<Button
									theme="secondary"
									type="button"
									className="text-[10px]"
									onClick={() => setInvitesOpen(false)}>
									Cancelar
								</Button>
								<Button theme="primary" type="submit" className="text-[10px]">
									<MdMailOutline aria-hidden="true" />
									Enviar convite
								</Button>
							</footer>
						</form>
					) : (
						<div className="px-5 py-5 mobile:px-6 mobile:py-6">
							{pendingInvites.length > 0 ? (
								<div className="grid gap-2.5">
									{pendingInvites.map(invite => (
										<div
											key={invite.id}
											className="flex flex-col gap-3 rounded-[14px] border border-slate-200 bg-slate-50 p-3.5 dark:border-[#2a3a42] dark:bg-[#131f26] mobile:flex-row mobile:items-center">
											<span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
												<MdEmail className="size-4" aria-hidden="true" />
											</span>
											<div className="min-w-0 flex-1">
												<strong className="block truncate text-[11px] text-slate-900 dark:text-white">
													{invite.email}
												</strong>
												<span className="mt-0.5 block text-[9px] text-slate-500 dark:text-slate-400">
													{invite.role} · Enviado {invite.sentAt.toLocaleLowerCase('pt-BR')}
												</span>
											</div>
											<Button
												theme="ghost"
												type="button"
												className="min-h-8 self-start px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10"
												onClick={() => revokeInvite(invite)}>
												<MdDeleteOutline aria-hidden="true" />
												Revogar
											</Button>
										</div>
									))}
								</div>
							) : (
								<div className="grid min-h-45 place-items-center text-center">
									<div>
										<span className="mx-auto grid size-12 place-items-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10">
											<MdCheck className="size-5" aria-hidden="true" />
										</span>
										<strong className="mt-3 block text-xs text-slate-800 dark:text-slate-100">
											Nenhum convite pendente
										</strong>
										<p className="mt-1 text-[10px] text-slate-400">
											Todos os convites já foram aceitos ou revogados.
										</p>
									</div>
								</div>
							)}
						</div>
					)}
				</SettingsDialog>
			)}

			{action && (
				<SettingsDialog
					title={action.type === 'remove' ? 'Remover membro?' : 'Transferir propriedade?'}
					description={
						action.type === 'remove'
							? `${action.member.name} perderá o acesso a esta área de trabalho.`
							: `${action.member.name} passará a controlar membros, convites e configurações da área.`
					}
					onClose={() => setAction(null)}
					className="max-w-115">
					<div className="px-5 py-5 mobile:px-6">
						<div
							className={`flex gap-3 rounded-[14px] border p-3.5 ${action.type === 'remove' ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300' : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300'}`}>
							<span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/70 dark:bg-black/10">
								{action.type === 'remove' ? (
									<MdDeleteOutline className="size-5" aria-hidden="true" />
								) : (
									<MdSwapHoriz className="size-5" aria-hidden="true" />
								)}
							</span>
							<p className="text-[10px] leading-4">
								{action.type === 'remove'
									? 'Esta ação remove o membro da lista imediatamente nesta prévia.'
									: 'Você continuará na equipe como administrador depois da transferência.'}
							</p>
						</div>
					</div>
					<footer className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50/70 px-5 py-4 dark:border-[#223138] dark:bg-[#101b21] mobile:px-6">
						<Button theme="secondary" type="button" className="text-[10px]" onClick={() => setAction(null)}>
							Cancelar
						</Button>
						<Button
							theme={action.type === 'remove' ? 'danger' : 'primary'}
							type="button"
							className="text-[10px]"
							onClick={confirmAction}>
							{action.type === 'remove' ? (
								<MdDeleteOutline aria-hidden="true" />
							) : (
								<MdSwapHoriz aria-hidden="true" />
							)}
							{action.type === 'remove' ? 'Remover membro' : 'Transferir posse'}
						</Button>
					</footer>
				</SettingsDialog>
			)}
		</>
	);
};
