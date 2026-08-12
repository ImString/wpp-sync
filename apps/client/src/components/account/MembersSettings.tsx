import { useCallback, useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
	MdArrowDownward,
	MdArrowUpward,
	MdAdminPanelSettings,
	MdCheck,
	MdClose,
	MdDeleteOutline,
	MdEmail,
	MdMailOutline,
	MdMoreHoriz,
	MdOutlineGroupAdd,
	MdRefresh,
	MdSearch,
	MdSwapHoriz
} from 'react-icons/md';

import {
	getResponseMessage,
	workspaceAPI,
	type WorkspaceInvite,
	type WorkspaceAccessRole,
	type WorkspaceMember,
	type WorkspaceMemberRole
} from '@/utils/api';

import { Button } from '@/components/buttons';
import { Pagination } from '@/components/pagination';
import { Image } from '@/components/shared/Image';
import type { AuthUser, Workspace } from '@/stores';

import type { SettingsFeedback } from './types';

interface MembersSettingsProps {
	currentUser: AuthUser | null;
	currentUserRole: WorkspaceMemberRole | null;
	workspace?: Workspace;
	workspaceUid?: string;
	onFeedback: (feedback: SettingsFeedback) => void;
	onCurrentUserRoleChange: (role: WorkspaceMemberRole) => void;
}

type MemberRole = 'Proprietário' | 'Administrador' | 'Membro';

interface MemberRow {
	id: string;
	userId: string;
	name: string;
	email: string;
	role: MemberRole;
	avatarUrl?: string | null;
	disabled: boolean;
}

interface PendingInvite {
	id: string;
	email: string;
	role: Exclude<MemberRole, 'Proprietário'>;
	sentAt: string;
}

type MemberAction =
	| { type: 'remove'; member: MemberRow }
	| { type: 'transfer'; member: MemberRow }
	| { type: 'role'; member: MemberRow; nextRole: WorkspaceAccessRole };

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

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
							<p className="mt-1 text-xs leading-4 text-slate-500 dark:text-slate-400">{description}</p>
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

const getMemberRole = (member: WorkspaceMember): MemberRole => {
	if (member.role === 'OWNER') return 'Proprietário';
	return member.role === 'ADMIN' ? 'Administrador' : 'Membro';
};

const mapMember = (member: WorkspaceMember): MemberRow | null => {
	if (!member.user) return null;

	return {
		id: member.id,
		userId: member.user.id,
		name: member.user.name || member.user.email || 'Usuário',
		email: member.user.email || 'E-mail não informado',
		avatarUrl: member.user.avatarUrl,
		role: getMemberRole(member),
		disabled: Boolean(member.disabled)
	};
};

const getInviteRole = (role?: WorkspaceInvite['role']): PendingInvite['role'] =>
	role === 'ADMIN' ? 'Administrador' : 'Membro';

const formatInviteDate = (value?: string) => {
	if (!value) return 'recentemente';

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return 'recentemente';

	return new Intl.DateTimeFormat('pt-BR', {
		dateStyle: 'short',
		timeStyle: 'short'
	}).format(date);
};

const mapInvite = (invite: WorkspaceInvite): PendingInvite => ({
	id: invite.id,
	email: invite.email || 'E-mail não informado',
	role: getInviteRole(invite.role),
	sentAt: formatInviteDate(invite.createdAt)
});

const MembersListSkeleton: React.FC<{ canManageMembers: boolean; count: number }> = props => {
	const items = Array.from({ length: Math.min(Math.max(props.count, 5), 8) }, (_, index) => index);

	return (
		<div className="animate-pulse motion-reduce:animate-none" role="status" aria-label="Carregando membros">
			{items.map(item => (
				<div
					key={item}
					aria-hidden="true"
					className={`grid min-h-18 items-center gap-3 border-b border-slate-100 px-3 last:border-0 dark:border-[#1b2a31] mobile:min-h-17 ${props.canManageMembers ? 'grid-cols-[minmax(0,1fr)_44px] mobile:grid-cols-[minmax(230px,1.6fr)_minmax(170px,1fr)_100px_44px]' : 'grid-cols-1 mobile:grid-cols-[minmax(230px,1.6fr)_minmax(170px,1fr)_100px]'}`}>
					<div className="flex min-w-0 items-center gap-3">
						<span className="size-9.5 shrink-0 rounded-full bg-slate-200 dark:bg-[#1b2a31]" />
						<span className="min-w-0 flex-1 space-y-2">
							<span className="block h-2.5 w-32 max-w-full rounded-full bg-slate-200 dark:bg-[#1b2a31]" />
							<span className="block h-2 w-44 max-w-4/5 rounded-full bg-slate-100 dark:bg-[#17262e]" />
							<span className="block h-2 w-24 rounded-full bg-slate-100 mobile:hidden dark:bg-[#17262e]" />
						</span>
					</div>
					<span className="hidden h-3 w-24 rounded-full bg-slate-100 mobile:block dark:bg-[#17262e]" />
					<span className="hidden h-5 w-14 rounded-full bg-slate-100 mobile:block dark:bg-[#17262e]" />
					{props.canManageMembers && <span className="size-9 rounded-lg bg-slate-100 dark:bg-[#17262e]" />}
				</div>
			))}
		</div>
	);
};

export const MembersSettings: React.FC<MembersSettingsProps> = ({
	currentUser,
	currentUserRole,
	workspace,
	workspaceUid,
	onFeedback,
	onCurrentUserRoleChange
}) => {
	const resolvedWorkspaceUid = workspace?.uid || workspaceUid;
	const isWorkspaceOwner = currentUserRole === 'OWNER';
	const canManageMembers = currentUserRole === 'ADMIN' || isWorkspaceOwner;
	const canManageTargetMember = (member: MemberRow) =>
		isWorkspaceOwner ? member.role !== 'Proprietário' : member.role === 'Membro';
	const [members, setMembers] = useState<MemberRow[]>([]);
	const [membersTotal, setMembersTotal] = useState(0);
	const [membersStatus, setMembersStatus] = useState<LoadStatus>('idle');
	const [membersError, setMembersError] = useState('');
	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(5);
	const [openMenuId, setOpenMenuId] = useState<string | null>(null);
	const [invitesOpen, setInvitesOpen] = useState(false);
	const [inviteView, setInviteView] = useState<'new' | 'pending'>('new');
	const [inviteEmail, setInviteEmail] = useState('');
	const [inviteRole, setInviteRole] = useState<PendingInvite['role']>('Membro');
	const [inviteError, setInviteError] = useState('');
	const [inviteSubmitting, setInviteSubmitting] = useState(false);
	const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
	const [invitesStatus, setInvitesStatus] = useState<LoadStatus>('idle');
	const [invitesError, setInvitesError] = useState('');
	const [revokingInviteId, setRevokingInviteId] = useState<string | null>(null);
	const [action, setAction] = useState<MemberAction | null>(null);
	const [actionSubmitting, setActionSubmitting] = useState(false);

	useEffect(() => {
		if (!isWorkspaceOwner && inviteRole === 'Administrador') {
			setInviteRole('Membro');
		}
	}, [inviteRole, isWorkspaceOwner]);

	const loadMembers = useCallback(
		async (currentPage: number, currentPageSize: number, searchTerm = '', signal?: AbortSignal) => {
			if (!resolvedWorkspaceUid) return false;

			setMembersStatus('loading');
			setMembersError('');

			try {
				const response = await workspaceAPI.listMembers(resolvedWorkspaceUid, {
					page: currentPage,
					limit: currentPageSize,
					search: searchTerm || undefined,
					signal
				});
				if (!response.success || !response.data) {
					throw new Error(getResponseMessage(response, 'Não foi possível carregar os membros.'));
				}

				setMembers(response.data.items.map(mapMember).filter((member): member is MemberRow => Boolean(member)));
				setMembersTotal(response.data.total);
				setMembersStatus('ready');
				return true;
			} catch (error) {
				if (signal?.aborted) return false;
				setMembersError(error instanceof Error ? error.message : 'Não foi possível carregar os membros.');
				setMembersStatus('error');
				return false;
			}
		},
		[resolvedWorkspaceUid]
	);

	const loadPendingInvites = useCallback(
		async (signal?: AbortSignal) => {
			if (!resolvedWorkspaceUid || !canManageMembers) return false;

			setInvitesStatus('loading');
			setInvitesError('');

			try {
				const response = await workspaceAPI.listPendingInvites(resolvedWorkspaceUid, signal);
				if (!response.success || !response.data) {
					throw new Error(getResponseMessage(response, 'Não foi possível carregar os convites.'));
				}

				setPendingInvites(response.data.items.map(mapInvite));
				setInvitesStatus('ready');
				return true;
			} catch (error) {
				if (signal?.aborted) return false;
				setInvitesError(error instanceof Error ? error.message : 'Não foi possível carregar os convites.');
				setInvitesStatus('error');
				return false;
			}
		},
		[canManageMembers, resolvedWorkspaceUid]
	);

	useEffect(() => {
		const timeout = window.setTimeout(() => {
			setDebouncedSearch(search.trim());
			setPage(1);
		}, 300);

		return () => window.clearTimeout(timeout);
	}, [search]);

	useEffect(() => {
		if (!resolvedWorkspaceUid) {
			setMembers([]);
			setMembersTotal(0);
			setMembersStatus('idle');
			return;
		}

		const controller = new AbortController();
		void loadMembers(page, pageSize, debouncedSearch, controller.signal);
		return () => controller.abort();
	}, [debouncedSearch, loadMembers, page, pageSize, resolvedWorkspaceUid]);

	useEffect(() => {
		const totalPages = Math.max(1, Math.ceil(membersTotal / pageSize));
		if (page > totalPages) setPage(totalPages);
	}, [membersTotal, page, pageSize]);

	useEffect(() => {
		if (!resolvedWorkspaceUid || !canManageMembers) {
			setPendingInvites([]);
			setInvitesStatus('idle');
			setInvitesOpen(false);
			return;
		}

		const controller = new AbortController();
		setPendingInvites([]);
		void loadPendingInvites(controller.signal);
		return () => controller.abort();
	}, [canManageMembers, loadPendingInvites, resolvedWorkspaceUid]);

	const refreshMembers = async () => {
		const success = await loadMembers(page, pageSize, debouncedSearch);
		if (!success) {
			onFeedback({ type: 'error', message: 'Não foi possível atualizar a lista de membros.' });
		}
	};

	const refreshPendingInvites = async () => {
		const success = await loadPendingInvites();
		if (!success) {
			onFeedback({ type: 'error', message: 'Não foi possível atualizar a lista de convites.' });
		}
	};

	const handleInvite = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!canManageMembers) return;

		const normalizedEmail = inviteEmail.trim().toLowerCase();

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
			setInviteError('Informe um e-mail válido.');
			return;
		}

		if (
			pendingInvites.some(invite => invite.email.toLowerCase() === normalizedEmail) ||
			members.some(member => member.email.toLowerCase() === normalizedEmail)
		) {
			setInviteError('Este e-mail já é membro ou possui um convite pendente.');
			return;
		}

		if (!resolvedWorkspaceUid) {
			setInviteError('Área de trabalho não encontrada.');
			return;
		}

		setInviteSubmitting(true);
		setInviteError('');

		try {
			const response = await workspaceAPI.createInvite(resolvedWorkspaceUid, {
				email: normalizedEmail,
				role: isWorkspaceOwner && inviteRole === 'Administrador' ? 'ADMIN' : 'MEMBER'
			});

			if (!response.success) {
				const message =
					response.code === 'USER_NOT_FOUND'
						? 'Não existe uma conta cadastrada com este e-mail.'
						: response.code === 'INVITE_SAME_EMAIL'
							? 'Este e-mail já possui um convite pendente.'
							: getResponseMessage(response, 'Não foi possível enviar o convite.');
				throw new Error(message);
			}

			setInviteEmail('');
			setInviteView('pending');
			await loadPendingInvites();
			onFeedback({ type: 'success', message: `Convite enviado para ${normalizedEmail}.` });
		} catch (error) {
			setInviteError(error instanceof Error ? error.message : 'Não foi possível enviar o convite.');
		} finally {
			setInviteSubmitting(false);
		}
	};

	const revokeInvite = async (invite: PendingInvite) => {
		if (!resolvedWorkspaceUid || !canManageMembers) return;

		setRevokingInviteId(invite.id);
		try {
			const response = await workspaceAPI.revokeInvite(resolvedWorkspaceUid, invite.id);
			if (!response.success) {
				throw new Error(getResponseMessage(response, 'Não foi possível revogar o convite.'));
			}

			setPendingInvites(current => current.filter(item => item.id !== invite.id));
			onFeedback({ type: 'info', message: `Convite de ${invite.email} revogado.` });
		} catch (error) {
			onFeedback({
				type: 'error',
				message: error instanceof Error ? error.message : 'Não foi possível revogar o convite.'
			});
		} finally {
			setRevokingInviteId(null);
		}
	};

	const confirmAction = async () => {
		if (!action) return;
		if (
			!canManageMembers ||
			((action.type === 'transfer' || action.type === 'role') && !isWorkspaceOwner) ||
			(action.type === 'remove' && !isWorkspaceOwner && action.member.role !== 'Membro')
		) {
			setAction(null);
			setOpenMenuId(null);
			return;
		}

		if (action.type === 'remove') {
			setMembers(current => current.filter(member => member.id !== action.member.id));
			setMembersTotal(current => Math.max(0, current - 1));
			onFeedback({ type: 'success', message: `${action.member.name} foi removido da lista.` });
			setAction(null);
			setOpenMenuId(null);
			return;
		}

		if (!resolvedWorkspaceUid) {
			onFeedback({ type: 'error', message: 'Área de trabalho não encontrada.' });
			return;
		}

		setActionSubmitting(true);

		try {
			const response =
				action.type === 'transfer'
					? await workspaceAPI.transferOwnership(resolvedWorkspaceUid, action.member.id)
					: await workspaceAPI.updateMemberRole(resolvedWorkspaceUid, action.member.id, action.nextRole);

			if (!response.success) {
				throw new Error(
					getResponseMessage(
						response,
						action.type === 'transfer'
							? 'Não foi possível transferir a posse.'
							: 'Não foi possível alterar a função do membro.'
					)
				);
			}

			if (action.type === 'transfer') {
				onCurrentUserRoleChange('MEMBER');

				try {
					const membershipResponse = await workspaceAPI.getMembership(resolvedWorkspaceUid);
					if (membershipResponse.success && membershipResponse.data?.role) {
						onCurrentUserRoleChange(membershipResponse.data.role);
					}
				} catch {}
			} else if (action.member.userId === currentUser?.id) {
				onCurrentUserRoleChange(action.nextRole);
			}

			await loadMembers(page, pageSize, debouncedSearch);

			onFeedback({
				type: 'success',
				message:
					action.type === 'transfer'
						? `A posse foi transferida para ${action.member.name}.`
						: action.nextRole === 'ADMIN'
							? `${action.member.name} foi promovido a administrador.`
							: `${action.member.name} foi rebaixado para membro.`
			});
			setAction(null);
			setOpenMenuId(null);
		} catch (error) {
			onFeedback({
				type: 'error',
				message:
					error instanceof Error
						? error.message
						: action.type === 'transfer'
							? 'Não foi possível transferir a posse.'
							: 'Não foi possível alterar a função do membro.'
			});
		} finally {
			setActionSubmitting(false);
		}
	};

	return (
		<>
			<section className="overflow-visible rounded-[20px] border border-slate-200 bg-white shadow-panel dark:border-[#223138] dark:bg-[#0e181e]">
				<header className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4.5 dark:border-[#223138] mobile:flex-row mobile:items-center mobile:justify-between mobile:px-6">
					<div>
						<h2 className="m-0 text-sm font-bold text-slate-900 dark:text-white">Membros da equipe</h2>
						<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
							{membersStatus === 'loading' && membersTotal === 0
								? 'Carregando pessoas com acesso...'
								: `${membersTotal} ${membersTotal === 1 ? 'pessoa possui' : 'pessoas possuem'} acesso a esta área.`}
						</p>
					</div>
					{canManageMembers && (
						<Button
							theme="primary"
							type="button"
							className="min-h-10 self-start px-3 text-xs mobile:self-auto"
							onClick={() => setInvitesOpen(true)}>
							<MdOutlineGroupAdd className="size-4.5" aria-hidden="true" />
							Convites
							{pendingInvites.length > 0 && (
								<span className="grid min-w-4.5 place-items-center rounded-full bg-white/20 px-1 text-[9px]">
									{pendingInvites.length}
								</span>
							)}
						</Button>
					)}
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
					<Button
						theme="secondary"
						type="button"
						aria-label="Atualizar membros"
						className="size-10 min-h-10 shrink-0 p-0 text-xs mobile:h-auto mobile:w-auto mobile:px-3"
						disabled={!resolvedWorkspaceUid || membersStatus === 'loading'}
						onClick={() => void refreshMembers()}>
						<MdRefresh
							className={`size-4.5 ${membersStatus === 'loading' ? 'animate-spin' : ''}`}
							aria-hidden="true"
						/>
						<span className="hidden mobile:inline">Atualizar</span>
					</Button>
				</div>

				<div className="px-3 pb-4 mobile:px-6 mobile:pb-6">
					<div>
						<div
							className={`hidden gap-3 border-b border-slate-200 px-3 py-2 text-[9px] font-bold uppercase tracking-[.08em] text-slate-400 dark:border-[#223138] mobile:grid ${canManageMembers ? 'mobile:grid-cols-[minmax(230px,1.6fr)_minmax(170px,1fr)_100px_44px]' : 'mobile:grid-cols-[minmax(230px,1.6fr)_minmax(170px,1fr)_100px]'}`}>
							<span>Membro</span>
							<span>Função</span>
							<span>Status</span>
							{canManageMembers && <span className="sr-only">Ações</span>}
						</div>

						{membersStatus === 'loading' ? (
							<MembersListSkeleton canManageMembers={canManageMembers} count={pageSize} />
						) : membersStatus === 'error' ? (
							<div className="grid min-h-40 place-items-center text-center" role="alert">
								<div>
									<strong className="block text-xs text-slate-700 dark:text-slate-200">
										Não foi possível carregar os membros
									</strong>
									<p className="mt-1 text-xs text-slate-400">{membersError}</p>
									<Button
										theme="secondary"
										type="button"
										className="mt-3 min-h-8 px-3 text-xs"
										onClick={() => void loadMembers(page, pageSize, debouncedSearch)}>
										Tentar novamente
									</Button>
								</div>
							</div>
						) : members.length > 0 ? (
							members.map(member => (
								<div
									key={member.id}
									className={`relative grid min-h-18 items-center gap-3 border-b border-slate-100 px-3 last:border-0 dark:border-[#1b2a31] mobile:min-h-17 ${canManageMembers ? 'grid-cols-[minmax(0,1fr)_44px] mobile:grid-cols-[minmax(230px,1.6fr)_minmax(170px,1fr)_100px_44px]' : 'grid-cols-1 mobile:grid-cols-[minmax(230px,1.6fr)_minmax(170px,1fr)_100px]'}`}>
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
												{member.userId === currentUser?.id && (
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
												<span
													className={`size-1 rounded-full ${member.disabled ? 'bg-slate-400' : 'bg-emerald-500'}`}
												/>
												{member.disabled ? 'Inativo' : 'Ativo'}
											</span>
										</div>
									</div>
									<span className="hidden items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 mobile:flex">
										<MdAdminPanelSettings
											className={`size-4 ${member.role === 'Proprietário' ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`}
											aria-hidden="true"
										/>
										{member.role}
									</span>
									<span
										className={`hidden w-fit items-center gap-1.5 rounded-full px-2 py-1 text-[9px] font-bold mobile:inline-flex ${member.disabled ? 'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
										<span
											className={`size-1.5 rounded-full ${member.disabled ? 'bg-slate-400' : 'bg-emerald-500'}`}
										/>
										{member.disabled ? 'Inativo' : 'Ativo'}
									</span>
									{canManageMembers && (
										<div className="relative">
											{canManageTargetMember(member) ? (
												<Button
													theme="ghost"
													type="button"
													className="size-9 min-h-9 p-0 text-lg"
													aria-label={`Ações de ${member.name}`}
													aria-expanded={openMenuId === member.id}
													onClick={() =>
														setOpenMenuId(current =>
															current === member.id ? null : member.id
														)
													}>
													<MdMoreHoriz aria-hidden="true" />
												</Button>
											) : (
												<span className="block size-9" />
											)}
											{openMenuId === member.id && canManageTargetMember(member) && (
												<div className="absolute right-0 top-[calc(100%+4px)] z-20 w-47 rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_14px_36px_rgba(15,23,42,.16)] dark:border-[#2a3a42] dark:bg-[#131f26]">
													{isWorkspaceOwner && (
														<button
															className="flex min-h-9 w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-[#17262e]"
															type="button"
															onClick={() => setAction({ type: 'transfer', member })}>
															<MdSwapHoriz
																className="size-4 text-brand-600 dark:text-brand-400"
																aria-hidden="true"
															/>
															Transferir posse
														</button>
													)}
													{isWorkspaceOwner && (
														<button
															className="flex min-h-9 w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-[#17262e]"
															type="button"
															onClick={() =>
																setAction({
																	type: 'role',
																	member,
																	nextRole:
																		member.role === 'Administrador'
																			? 'MEMBER'
																			: 'ADMIN'
																})
															}>
															{member.role === 'Administrador' ? (
																<MdArrowDownward
																	className="size-4 text-amber-600"
																	aria-hidden="true"
																/>
															) : (
																<MdArrowUpward
																	className="size-4 text-brand-600 dark:text-brand-400"
																	aria-hidden="true"
																/>
															)}
															{member.role === 'Administrador'
																? 'Rebaixar para membro'
																: 'Promover a administrador'}
														</button>
													)}
													<button
														className="flex min-h-9 w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 text-left text-xs font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
														type="button"
														onClick={() => setAction({ type: 'remove', member })}>
														<MdDeleteOutline className="size-4" aria-hidden="true" />
														Remover membro
													</button>
												</div>
											)}
										</div>
									)}
								</div>
							))
						) : (
							<div className="grid min-h-40 place-items-center text-center">
								<div>
									<MdSearch className="mx-auto size-6 text-slate-300" aria-hidden="true" />
									<strong className="mt-2 block text-xs text-slate-700 dark:text-slate-200">
										Nenhum membro encontrado
									</strong>
									<p className="mt-1 text-xs text-slate-400">
										{search
											? 'Tente buscar com outro termo.'
											: 'Nenhuma pessoa possui acesso a esta área.'}
									</p>
								</div>
							</div>
						)}

						{membersTotal > 0 && membersStatus !== 'error' && (
							<Pagination
								page={page}
								pageSize={pageSize}
								totalItems={membersTotal}
								disabled={membersStatus === 'loading'}
								itemLabel="membros"
								singularItemLabel="membro"
								onPageChange={nextPage => {
									setOpenMenuId(null);
									setPage(nextPage);
								}}
								onPageSizeChange={nextPageSize => {
									setOpenMenuId(null);
									setPageSize(nextPageSize);
									setPage(1);
								}}
							/>
						)}
					</div>
				</div>
			</section>

			{invitesOpen && canManageMembers && (
				<SettingsDialog
					title="Gerenciar convites"
					description="Convide novas pessoas por e-mail ou revogue acessos ainda não aceitos."
					onClose={() => setInvitesOpen(false)}
					className="max-w-152.5">
					<div className="flex items-center justify-between gap-2 border-b border-slate-200 px-5 pt-3 dark:border-[#223138] mobile:px-6">
						<div className="flex min-w-0 gap-1">
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
						{inviteView === 'pending' && (
							<Button
								theme="ghost"
								type="button"
								className="min-h-8 shrink-0 px-2 text-xs"
								disabled={!resolvedWorkspaceUid || invitesStatus === 'loading'}
								onClick={() => void refreshPendingInvites()}>
								<MdRefresh
									className={`size-4 ${invitesStatus === 'loading' ? 'animate-spin' : ''}`}
									aria-hidden="true"
								/>
								Atualizar
							</Button>
						)}
					</div>

					{inviteView === 'new' ? (
						<form onSubmit={handleInvite}>
							<div className="grid gap-4 px-5 py-5 mobile:grid-cols-[minmax(0,1fr)_160px] mobile:px-6 mobile:py-6">
								<label className="grid gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
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
								<label className="grid content-start gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
									<span>Função</span>
									<select
										className="h-11 rounded-xl cursor-pointer border border-slate-200 bg-slate-50 px-3 text-xs font-normal text-slate-900 outline-none focus:border-brand-500 dark:border-[#2a3a42] dark:bg-[#131f26] dark:text-white"
										value={inviteRole}
										onChange={event => setInviteRole(event.target.value as PendingInvite['role'])}>
										<option>Membro</option>
										{isWorkspaceOwner && <option>Administrador</option>}
									</select>
								</label>
							</div>
							<footer className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50/70 px-5 py-4 dark:border-[#223138] dark:bg-[#101b21] mobile:px-6">
								<Button
									theme="secondary"
									type="button"
									className="text-xs"
									onClick={() => setInvitesOpen(false)}>
									Cancelar
								</Button>
								<Button
									theme="primary"
									type="submit"
									className="text-xs"
									loading={inviteSubmitting}
									loadingLabel="Enviando...">
									<MdMailOutline aria-hidden="true" />
									Enviar convite
								</Button>
							</footer>
						</form>
					) : (
						<div className="px-5 py-5 mobile:px-6 mobile:py-6">
							{invitesStatus === 'loading' && pendingInvites.length === 0 ? (
								<div className="grid min-h-45 place-items-center text-center" role="status">
									<div>
										<span className="mx-auto block size-6 animate-spin rounded-full border-2 border-brand-100 border-t-brand-600 dark:border-brand-950 dark:border-t-brand-400" />
										<strong className="mt-3 block text-xs text-slate-800 dark:text-slate-100">
											Carregando convites...
										</strong>
									</div>
								</div>
							) : invitesStatus === 'error' && pendingInvites.length === 0 ? (
								<div className="grid min-h-45 place-items-center text-center" role="alert">
									<div>
										<strong className="block text-xs text-slate-800 dark:text-slate-100">
											Não foi possível carregar os convites
										</strong>
										<p className="mt-1 text-xs text-slate-400">{invitesError}</p>
										<Button
											theme="secondary"
											type="button"
											className="mt-3 min-h-8 px-3 text-xs"
											onClick={() => void loadPendingInvites()}>
											Tentar novamente
										</Button>
									</div>
								</div>
							) : pendingInvites.length > 0 ? (
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
												loading={revokingInviteId === invite.id}
												loadingLabel="Revogando..."
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
										<p className="mt-1 text-xs text-slate-400">
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
					title={
						action.type === 'remove'
							? 'Remover membro?'
							: action.type === 'transfer'
								? 'Transferir propriedade?'
								: action.nextRole === 'ADMIN'
									? 'Promover membro?'
									: 'Rebaixar administrador?'
					}
					description={
						action.type === 'remove'
							? `${action.member.name} perderá o acesso a esta área de trabalho.`
							: action.type === 'transfer'
								? `${action.member.name} passará a controlar membros, convites e configurações da área.`
								: action.nextRole === 'ADMIN'
									? `${action.member.name} receberá permissões para gerenciar membros e convites.`
									: `${action.member.name} perderá as permissões administrativas desta área.`
					}
					onClose={() => {
						if (!actionSubmitting) setAction(null);
					}}
					className="max-w-115">
					<div className="px-5 py-5 mobile:px-6">
						<div
							className={`flex items-center gap-2.5 rounded-[14px] border p-3 ${action.type === 'remove' ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300' : action.type === 'role' && action.nextRole === 'ADMIN' ? 'border-brand-200 bg-brand-50 text-brand-800 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300' : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300'}`}>
							<span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/70 dark:bg-black/10">
								{action.type === 'remove' ? (
									<MdDeleteOutline className="size-5" aria-hidden="true" />
								) : action.type === 'transfer' ? (
									<MdSwapHoriz className="size-5" aria-hidden="true" />
								) : action.nextRole === 'ADMIN' ? (
									<MdArrowUpward className="size-5" aria-hidden="true" />
								) : (
									<MdArrowDownward className="size-5" aria-hidden="true" />
								)}
							</span>
							<p className="text-xs leading-4">
								{action.type === 'remove'
									? 'Esta ação remove o membro da lista imediatamente nesta prévia.'
									: action.type === 'transfer'
										? 'Sua função será atualizada automaticamente depois da transferência.'
										: action.nextRole === 'ADMIN'
											? 'O membro poderá convidar pessoas e alterar funções da equipe.'
											: 'O usuário continuará com acesso, mas sem opções administrativas.'}
							</p>
						</div>
					</div>
					<footer className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50/70 px-5 py-4 dark:border-[#223138] dark:bg-[#101b21] mobile:px-6">
						<Button
							theme="secondary"
							type="button"
							className="text-xs"
							disabled={actionSubmitting}
							onClick={() => setAction(null)}>
							Cancelar
						</Button>
						<Button
							theme={action.type === 'remove' ? 'danger' : 'primary'}
							type="button"
							className="text-xs"
							loading={actionSubmitting}
							loadingLabel={
								action.type === 'transfer'
									? 'Transferindo...'
									: action.type === 'role' && action.nextRole === 'ADMIN'
										? 'Promovendo...'
										: action.type === 'role'
											? 'Rebaixando...'
											: 'Removendo...'
							}
							onClick={() => void confirmAction()}>
							{action.type === 'remove' ? (
								<MdDeleteOutline aria-hidden="true" />
							) : action.type === 'transfer' ? (
								<MdSwapHoriz aria-hidden="true" />
							) : action.nextRole === 'ADMIN' ? (
								<MdArrowUpward aria-hidden="true" />
							) : (
								<MdArrowDownward aria-hidden="true" />
							)}
							{action.type === 'remove'
								? 'Remover membro'
								: action.type === 'transfer'
									? 'Transferir posse'
									: action.nextRole === 'ADMIN'
										? 'Promover membro'
										: 'Rebaixar administrador'}
						</Button>
					</footer>
				</SettingsDialog>
			)}
		</>
	);
};
