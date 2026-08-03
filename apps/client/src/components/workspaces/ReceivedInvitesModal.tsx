import { useEffect, useMemo, useState } from 'react';
import { MdClose, MdMailOutline, MdRefresh, MdSearch } from 'react-icons/md';

import type { WorkspaceInvite } from '@/utils/api';

import { Image } from '../shared/Image';
import { workspaceSecondaryButtonClassName } from './styles';

interface ReceivedInvitesModalProps {
	invites: WorkspaceInvite[];
	status: 'loading' | 'ready' | 'error';
	error: string;
	onClose: () => void;
	onRetry: () => void;
}

const normalizeSearch = (value: string) =>
	value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim();

const getRoleLabel = (role?: WorkspaceInvite['role']) => (role === 'ADMIN' ? 'Administrador' : 'Membro');

const formatInviteDate = (value?: string) => {
	if (!value) return 'Data não informada';

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return 'Data não informada';

	return `Recebido em ${new Intl.DateTimeFormat('pt-BR', {
		dateStyle: 'short',
		timeStyle: 'short'
	}).format(date)}`;
};

export const ReceivedInvitesModal: React.FC<ReceivedInvitesModalProps> = ({
	invites,
	status,
	error,
	onClose,
	onRetry
}) => {
	const [search, setSearch] = useState('');
	const filteredInvites = useMemo(() => {
		const normalizedSearch = normalizeSearch(search);
		if (!normalizedSearch) return invites;

		return invites.filter(invite =>
			normalizeSearch(`${invite.workspace?.name || ''} ${invite.email || ''}`).includes(normalizedSearch)
		);
	}, [invites, search]);

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
				className="w-full max-w-155 overflow-hidden rounded-[22px] border border-(--workspace-border) bg-(--workspace-surface) text-(--workspace-text) shadow-[0_28px_90px_rgba(2,6,23,.32)]"
				role="dialog"
				aria-modal="true"
				aria-labelledby="received-invites-title">
				<header className="flex items-start justify-between gap-4 border-b border-(--workspace-border) px-5 py-4.5 max-[680px]:px-4">
					<div>
						<span className="text-[9px] font-extrabold uppercase tracking-[.12em] text-brand-600">
							Acesso às áreas
						</span>
						<h2 id="received-invites-title" className="mt-1 text-base font-bold">
							Meus convites
						</h2>
						<p className="mt-1 text-[10px] text-(--workspace-muted)">
							Convites enviados para o seu e-mail por outras equipes.
						</p>
					</div>
					<button
						className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-xl bg-transparent text-xl text-(--workspace-muted) transition hover:bg-(--workspace-surface-hover) hover:text-(--workspace-text)"
						type="button"
						aria-label="Fechar"
						onClick={onClose}>
						<MdClose aria-hidden="true" />
					</button>
				</header>

				<div className="border-b border-(--workspace-border) px-5 py-3.5 max-[680px]:px-4">
					<label className="flex h-10 items-center gap-2 rounded-xl border border-(--workspace-border) bg-(--workspace-surface-muted) px-3 text-(--workspace-muted) focus-within:border-brand-500">
						<MdSearch className="size-4.5 shrink-0" aria-hidden="true" />
						<span className="sr-only">Buscar convite</span>
						<input
							className="min-w-0 flex-1 border-0 bg-transparent text-[11px] text-(--workspace-text) outline-none placeholder:text-(--workspace-soft)"
							type="search"
							placeholder="Buscar por área de trabalho..."
							value={search}
							onChange={event => setSearch(event.target.value)}
						/>
					</label>
				</div>

				<div className="max-h-[min(58vh,440px)] min-h-55 overflow-y-auto p-5 max-[680px]:p-4">
					{status === 'loading' && invites.length === 0 ? (
						<div className="grid min-h-45 place-items-center text-center" role="status">
							<div>
								<span className="mx-auto block size-7 animate-spin rounded-full border-3 border-brand-100 border-t-brand-600 dark:border-brand-950 dark:border-t-brand-400" />
								<strong className="mt-3 block text-xs">Carregando convites...</strong>
							</div>
						</div>
					) : status === 'error' && invites.length === 0 ? (
						<div className="grid min-h-45 place-items-center text-center" role="alert">
							<div>
								<strong className="block text-xs">Não foi possível carregar os convites</strong>
								<p className="mt-1 text-[10px] text-(--workspace-muted)">{error}</p>
								<button
									className={`${workspaceSecondaryButtonClassName} mt-3`}
									type="button"
									onClick={onRetry}>
									<MdRefresh aria-hidden="true" />
									Tentar novamente
								</button>
							</div>
						</div>
					) : filteredInvites.length > 0 ? (
						<div className="grid gap-2.5">
							{filteredInvites.map(invite => (
								<article
									key={invite.id}
									className="flex items-center gap-3.5 rounded-[15px] border border-(--workspace-border) bg-(--workspace-surface-muted) p-3.5">
									<Image
										className="size-11 shrink-0 rounded-[13px] object-cover"
										src={invite.workspace?.avatarUrl || undefined}
										seed={invite.workspace?.name || invite.email}
										collection="initials"
									/>
									<div className="min-w-0 flex-1">
										<strong className="block truncate text-xs">
											{invite.workspace?.name || 'Área de trabalho'}
										</strong>
										<span className="mt-0.5 block text-[9px] text-(--workspace-muted)">
											{getRoleLabel(invite.role)} · {formatInviteDate(invite.createdAt)}
										</span>
									</div>
									<span className="rounded-full bg-brand-50 px-2.5 py-1 text-[9px] font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
										Pendente
									</span>
								</article>
							))}
						</div>
					) : (
						<div className="grid min-h-45 place-items-center text-center">
							<div>
								<span className="mx-auto grid size-12 place-items-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
									<MdMailOutline className="size-5" aria-hidden="true" />
								</span>
								<strong className="mt-3 block text-xs">
									{search ? 'Nenhum convite encontrado' : 'Nenhum convite pendente'}
								</strong>
								<p className="mt-1 text-[10px] text-(--workspace-muted)">
									{search ? 'Tente buscar por outro nome.' : 'Novos convites aparecerão aqui.'}
								</p>
							</div>
						</div>
					)}
				</div>
			</section>
		</div>
	);
};
