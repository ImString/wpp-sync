import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	MdAdd,
	MdCheck,
	MdClose,
	MdDarkMode,
	MdGridView,
	MdKeyboardArrowDown,
	MdLightMode,
	MdLogout,
	MdMailOutline,
	MdNotificationsNone,
	MdOutlinePerson,
	MdSearch,
	MdTune
} from 'react-icons/md';
import { useLocation, useNavigate } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import { useShallow } from 'zustand/react/shallow';

import { authAPI, getResponseMessage, workspaceAPI, type WorkspaceInvite } from '@/utils/api';

import { Brand } from '@/components/brand';
import { useInterfaceStore } from '@/components/interface';
import { useAuthenticationStore, useWorkspaceStore } from '@/stores';
import type { CreateWorkspaceData, Workspace } from '@/stores';

import { Image } from '../shared/Image';
import { CreateWorkspaceModal } from './CreateWorkspaceModal';
import { ReceivedInvitesModal, type ReceivedInviteAction } from './ReceivedInvitesModal';
import { WorkspaceCard } from './WorkspaceCard';
import {
	workspaceEyebrowClassName,
	workspaceIconButtonClassName,
	workspacePrimaryButtonClassName,
	workspaceSecondaryButtonClassName
} from './styles';

interface WorkspaceLocationState {
	workspaceNotFound?: boolean;
}

const normalizeSearch = (value: string) => {
	return value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim();
};

const getInitials = (name?: string) => {
	return (name || 'Usuário')
		.split(/\s+/)
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

export const WorkspacePage: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const userMenuRef = useRef<HTMLDivElement>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);
	const locationState = location.state as WorkspaceLocationState | null;

	const [search, setSearch] = useState('');
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [receivedInvitesOpen, setReceivedInvitesOpen] = useState(false);
	const [receivedInvites, setReceivedInvites] = useState<WorkspaceInvite[]>([]);
	const [receivedInvitesStatus, setReceivedInvitesStatus] = useState<'loading' | 'ready' | 'error'>('loading');
	const [receivedInvitesError, setReceivedInvitesError] = useState('');
	const [processingInvite, setProcessingInvite] = useState<{
		id: string;
		action: ReceivedInviteAction;
	} | null>(null);
	const [userMenuOpen, setUserMenuOpen] = useState(false);
	const [toast, setToast] = useState(locationState?.workspaceNotFound ? 'A área solicitada não foi encontrada.' : '');

	useEffect(() => {
		if (locationState?.workspaceNotFound) {
			window.history.replaceState({}, document.title);
		}
	}, [locationState?.workspaceNotFound]);

	const { theme, toggleTheme } = useInterfaceStore(
		useShallow(state => ({ theme: state.theme, toggleTheme: state.toggleTheme }))
	);
	const { authToken, refreshToken, currentUser, clearAuthentication } = useAuthenticationStore(
		useShallow(state => ({
			authToken: state.authToken,
			refreshToken: state.refreshToken,
			currentUser: state.currentUser,
			clearAuthentication: state.clearAuthentication
		}))
	);
	const {
		workspaces,
		total: totalWorkspaces,
		listStatus,
		error: listError,
		listWorkspaces,
		createWorkspace,
		setActiveWorkspace,
		clearWorkspaces
	} = useWorkspaceStore(
		useShallow(state => ({
			workspaces: state.workspaces,
			total: state.total,
			listStatus: state.listStatus,
			error: state.error,
			listWorkspaces: state.listWorkspaces,
			createWorkspace: state.createWorkspace,
			setActiveWorkspace: state.setActiveWorkspace,
			clearWorkspaces: state.clearWorkspaces
		}))
	);

	const filteredWorkspaces = useMemo(() => {
		const normalizedSearch = normalizeSearch(search);
		if (!normalizedSearch) return workspaces;
		return workspaces.filter(workspace => normalizeSearch(workspace.name).includes(normalizedSearch));
	}, [search, workspaces]);

	const loadReceivedInvites = useCallback(async (signal?: AbortSignal) => {
		setReceivedInvitesStatus('loading');
		setReceivedInvitesError('');

		try {
			const response = await workspaceAPI.listReceivedInvites(signal);
			if (!response.success || !response.data) {
				throw new Error(getResponseMessage(response, 'Não foi possível carregar os convites.'));
			}

			setReceivedInvites(response.data.items);
			setReceivedInvitesStatus('ready');
		} catch (error) {
			if (signal?.aborted) return;
			setReceivedInvitesError(error instanceof Error ? error.message : 'Não foi possível carregar os convites.');
			setReceivedInvitesStatus('error');
		}
	}, []);

	useEffect(() => {
		const controller = new AbortController();

		void listWorkspaces(controller.signal).catch(error => {
			if (!controller.signal.aborted) {
				setToast(error instanceof Error ? error.message : 'Não foi possível carregar as áreas de trabalho.');
			}
		});

		return () => controller.abort();
	}, [listWorkspaces]);

	useEffect(() => {
		const controller = new AbortController();
		void loadReceivedInvites(controller.signal);
		return () => controller.abort();
	}, [loadReceivedInvites]);

	useEffect(() => {
		if (!toast) return;
		const timeout = window.setTimeout(() => setToast(''), 4200);
		return () => window.clearTimeout(timeout);
	}, [toast]);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
				event.preventDefault();
				searchInputRef.current?.focus();
			}

			if (event.key === 'Escape') {
				setUserMenuOpen(false);
				setCreateModalOpen(false);
			}
		};

		const handlePointerDown = (event: MouseEvent) => {
			if (!userMenuRef.current?.contains(event.target as Node)) setUserMenuOpen(false);
		};

		document.addEventListener('keydown', handleKeyDown);
		document.addEventListener('mousedown', handlePointerDown);
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
			document.removeEventListener('mousedown', handlePointerDown);
		};
	}, []);

	useEffect(() => {
		document.body.style.overflow = createModalOpen || receivedInvitesOpen ? 'hidden' : '';
		return () => {
			document.body.style.overflow = '';
		};
	}, [createModalOpen, receivedInvitesOpen]);

	const selectWorkspace = (workspace: Workspace) => {
		setActiveWorkspace(workspace.uid);
		navigate(`/w/${workspace.uid}`);
	};

	const handleCreateWorkspace = async (data: CreateWorkspaceData) => {
		await createWorkspace(data);
		setToast(`A área “${data.name}” foi criada com sucesso.`);
	};

	const retryList = () => {
		void listWorkspaces().catch(error => {
			setToast(error instanceof Error ? error.message : 'Não foi possível carregar as áreas de trabalho.');
		});
	};

	const handleInviteAction = async (invite: WorkspaceInvite, action: ReceivedInviteAction) => {
		if (processingInvite) return;

		setProcessingInvite({ id: invite.id, action });

		try {
			const response =
				action === 'accept'
					? await workspaceAPI.acceptInvite(invite.id)
					: await workspaceAPI.rejectInvite(invite.id);

			if (!response.success) {
				throw new Error(
					getResponseMessage(
						response,
						action === 'accept'
							? 'Não foi possível aceitar o convite.'
							: 'Não foi possível recusar o convite.'
					)
				);
			}

			setReceivedInvites(current => current.filter(item => item.id !== invite.id));

			if (action === 'accept') {
				try {
					await listWorkspaces();
					setToast(`O convite para “${invite.workspace?.name || 'a área de trabalho'}” foi aceito.`);
				} catch {
					setToast('Convite aceito. Recarregue a lista para visualizar a nova área de trabalho.');
				}
			} else {
				setToast(`O convite para “${invite.workspace?.name || 'a área de trabalho'}” foi recusado.`);
			}
		} catch (error) {
			setToast(
				error instanceof Error
					? error.message
					: action === 'accept'
						? 'Não foi possível aceitar o convite.'
						: 'Não foi possível recusar o convite.'
			);
		} finally {
			setProcessingInvite(null);
		}
	};

	const handleLogout = () => {
		void authAPI.logout(refreshToken, authToken).catch(() => undefined);
		clearWorkspaces();
		clearAuthentication();
		navigate('/auth/login', { replace: true });
	};

	return (
		<div className="workspace-app relative isolate min-h-dvh">
			<header className="sticky top-0 z-30 flex min-h-18 items-center justify-between gap-6 border-b border-(--workspace-border) bg-(--workspace-header) px-[max(24px,calc((100vw-1180px)/2))] backdrop-blur-[18px] max-[980px]:px-5 max-[680px]:min-h-16 max-[680px]:px-3.5">
				<Brand
					className="gap-2.5"
					markClassName="size-9 max-[680px]:size-8"
					nameClassName="text-[21px] font-extrabold tracking-[-.055em] text-[var(--workspace-text)] max-[680px]:text-[19px]"
				/>

				<div className="relative flex items-center gap-1.5">
					<button
						className={workspaceIconButtonClassName}
						type="button"
						onClick={toggleTheme}
						aria-label={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
						aria-pressed={theme === 'dark'}>
						{theme === 'light' ? <MdLightMode aria-hidden="true" /> : <MdDarkMode aria-hidden="true" />}
					</button>

					<button
						className={twMerge(workspaceIconButtonClassName, 'max-[420px]:hidden')}
						type="button"
						aria-label="Notificações"
						onClick={() => setToast('Você possui 2 notificações novas.')}>
						<MdNotificationsNone aria-hidden="true" />
						<span className="absolute top-0.5 right-0.5 grid h-4.25 min-w-4.25 place-items-center rounded-full border-2 border-(--workspace-surface) bg-brand-600 px-1 text-[9px] font-bold text-white">
							2
						</span>
					</button>

					<div className="relative" ref={userMenuRef}>
						<button
							className="cursor-pointer flex h-12 min-w-0 items-center gap-2.5 rounded-[14px] bg-transparent px-2 py-1.5 text-(--workspace-text) transition hover:bg-(--workspace-surface-hover) max-[680px]:size-10.5 max-[680px]:p-1 [&>svg]:size-4.25 max-[680px]:[&>svg]:hidden"
							type="button"
							aria-expanded={userMenuOpen}
							aria-haspopup="menu"
							onClick={() => setUserMenuOpen(isOpen => !isOpen)}>
							<Image
								className="grid size-8.5 shrink-0 place-items-center rounded-full"
								src={currentUser?.avatarUrl || undefined}
								seed={currentUser?.name}
								collection="initials"
							/>
							<span className="flex min-w-0 flex-col text-left max-[680px]:hidden">
								<strong className="max-w-35 truncate text-xs">{currentUser?.name || 'Usuário'}</strong>
								<small className="text-[9px] text-(--workspace-muted)">
									{getRoleLabel(currentUser?.role)}
								</small>
							</span>
							<MdKeyboardArrowDown aria-hidden="true" />
						</button>

						{userMenuOpen && (
							<div
								className="absolute top-[calc(100%+8px)] right-0 w-50 rounded-[14px] border border-(--workspace-border) bg-(--workspace-surface) p-1.75 shadow-(--workspace-shadow-card) [&>button]:cursor-pointer [&>button]:flex [&>button]:min-h-9.5 [&>button]:w-full [&>button]:items-center [&>button]:gap-2.25 [&>button]:rounded-[9px] [&>button]:bg-transparent [&>button]:px-2.75 [&>button]:text-left [&>button]:text-xs [&>button]:transition [&>button:hover]:bg-(--workspace-surface-hover) [&_svg]:size-4.25 [&_svg]:text-(--workspace-muted) [&>hr]:my-1.5 [&>hr]:border-0 [&>hr]:border-t [&>hr]:border-(--workspace-border)"
								role="menu">
								<button type="button" role="menuitem" onClick={() => navigate('/profile')}>
									<MdOutlinePerson aria-hidden="true" />
									Minha conta
								</button>
								<hr />
								<button type="button" role="menuitem" onClick={handleLogout}>
									<MdLogout aria-hidden="true" />
									Sair
								</button>
							</div>
						)}
					</div>
				</div>
			</header>

			<main className="relative z-1 mx-auto w-[min(1180px,calc(100%-40px))] pt-13.5 pb-7 max-[680px]:w-[min(1180px,calc(100%-24px))] max-[680px]:pt-7.5">
				<section className="mb-7 flex items-center gap-4 max-[680px]:items-start">
					<div
						className="grid size-13 shrink-0 place-items-center rounded-2xl border border-brand-100 bg-brand-50 text-brand-600 dark:border-[rgba(37,211,102,.18)] dark:bg-[rgba(37,211,102,.11)] max-[680px]:size-11.5"
						aria-hidden="true">
						<MdGridView className="size-5" />
					</div>
					<div>
						<span className={workspaceEyebrowClassName}>Organização</span>
						<h1 className="m-0 text-[clamp(25px,3vw,34px)] font-bold tracking-tighter">
							Áreas de trabalho
						</h1>
						<p className="mt-1.5 text-[13px] text-(--workspace-muted) max-[680px]:text-[11px]">
							Selecione onde deseja entrar ou crie uma nova área para sua equipe.
						</p>
					</div>
				</section>

				<section className="overflow-hidden rounded-[22px] border border-(--workspace-border) bg-(--workspace-surface) shadow-(--workspace-shadow-app) max-[680px]:rounded-[17px]">
					<header className="flex min-h-23.5 items-center justify-between gap-5 border-b border-(--workspace-border) px-6 py-5.5 max-[980px]:flex-col max-[980px]:items-start max-[680px]:min-h-0 max-[680px]:p-4.5">
						<div>
							<h2 className="m-0 text-[17px] font-bold tracking-[-.03em]">Suas áreas</h2>
							<p className="mt-1 text-[11px] text-(--workspace-muted)">
								{totalWorkspaces}{' '}
								{totalWorkspaces === 1
									? 'área de trabalho disponível'
									: 'áreas de trabalho disponíveis'}
							</p>
						</div>

						<div className="flex items-center gap-2.25 max-[980px]:w-full max-[680px]:grid max-[680px]:grid-cols-2 max-[420px]:grid-cols-1">
							<label className="flex h-10.5 w-58.75 items-center gap-2 rounded-[11px] border border-transparent bg-(--workspace-surface-muted) px-2.75 text-(--workspace-muted) focus-within:border-brand-500/55 focus-within:bg-(--workspace-surface) max-[980px]:w-auto max-[980px]:flex-1 max-[680px]:col-span-full max-[420px]:col-span-1">
								<MdSearch className="size-5 shrink-0" aria-hidden="true" />
								<span className="sr-only">Pesquisar área</span>
								<input
									className="w-full min-w-0 border-0 bg-transparent p-0 text-[11px] outline-0 placeholder:text-(--workspace-soft)"
									ref={searchInputRef}
									type="search"
									placeholder="Pesquisar área..."
									autoComplete="off"
									value={search}
									onChange={event => setSearch(event.target.value)}
								/>
								<kbd className="whitespace-nowrap rounded-[5px] border border-(--workspace-border) bg-(--workspace-surface) px-1.5 py-0.5 font-[inherit] text-[8px] text-(--workspace-soft)">
									Ctrl K
								</kbd>
							</label>

							<button
								className={workspaceSecondaryButtonClassName}
								type="button"
								onClick={() => setReceivedInvitesOpen(true)}>
								<MdMailOutline aria-hidden="true" />
								Meus convites
								{receivedInvites.length > 0 && (
									<span className="grid h-4.5 min-w-4.5 place-items-center rounded-full bg-brand-600 px-1 text-[8px] text-white">
										{receivedInvites.length}
									</span>
								)}
							</button>

							<button
								className={workspacePrimaryButtonClassName}
								type="button"
								onClick={() => setCreateModalOpen(true)}>
								<MdAdd aria-hidden="true" />
								Nova área
							</button>
						</div>
					</header>

					{listStatus === 'loading' && workspaces.length === 0 ? (
						<div className="grid min-h-70 place-items-center content-center p-10 text-center" role="status">
							<span className="mb-3 size-8 animate-spin rounded-full border-3 border-brand-100 border-t-brand-600 dark:border-brand-950 dark:border-t-brand-400" />
							<strong className="text-sm">Carregando áreas de trabalho...</strong>
						</div>
					) : listStatus === 'error' && workspaces.length === 0 ? (
						<div className="grid min-h-70 place-items-center content-center p-10 text-center" role="alert">
							<strong className="text-sm">Não foi possível carregar suas áreas</strong>
							<p className="mt-1.5 text-[11px] text-(--workspace-muted)">
								{listError || 'Verifique sua conexão e tente novamente.'}
							</p>
							<button className={workspaceSecondaryButtonClassName} type="button" onClick={retryList}>
								Tentar novamente
							</button>
						</div>
					) : filteredWorkspaces.length > 0 ? (
						<div className="grid grid-cols-3 gap-4 p-6 max-[980px]:grid-cols-2 max-[680px]:grid-cols-1 max-[680px]:gap-2.75 max-[680px]:p-3.5">
							{filteredWorkspaces.map(workspace => (
								<WorkspaceCard key={workspace.id} workspace={workspace} onSelect={selectWorkspace} />
							))}

							{!search && (
								<button
									className="relative cursor-pointer flex min-h-34.5 min-w-0 flex-col items-center justify-center gap-2 rounded-[17px] border border-dashed border-(--workspace-border) bg-(--workspace-surface-muted) p-3.75 text-center text-(--workspace-muted) transition duration-150 hover:-translate-y-0.75 hover:border-brand-500 hover:bg-(--workspace-surface-hover) hover:text-(--workspace-text) max-[680px]:min-h-36.5"
									type="button"
									onClick={() => setCreateModalOpen(true)}>
									<span className="grid size-10.5 place-items-center rounded-full bg-brand-50 text-brand-600 dark:bg-[rgba(37,211,102,.11)]">
										<MdAdd className="size-5" aria-hidden="true" />
									</span>
									<strong className="text-xs">Criar nova área</strong>
									<small className="max-w-52.5 text-[9px] text-(--workspace-soft)">
										Configure um espaço para outra empresa ou equipe.
									</small>
								</button>
							)}
						</div>
					) : (
						<div className="grid min-h-70 place-items-center content-center p-10 text-center">
							<span className="mb-2.5 grid size-14 place-items-center rounded-full bg-brand-50 text-brand-600 dark:bg-[rgba(37,211,102,.11)]">
								<MdSearch className="size-5" aria-hidden="true" />
							</span>
							<strong className="text-sm">Nenhuma área encontrada</strong>
							<p className="mt-1.5 text-[11px] text-(--workspace-muted)">
								Revise o termo digitado ou crie uma nova área de trabalho.
							</p>
						</div>
					)}
				</section>
			</main>

			{createModalOpen && (
				<CreateWorkspaceModal
					isOpen
					onClose={() => setCreateModalOpen(false)}
					onCreate={handleCreateWorkspace}
				/>
			)}

			{receivedInvitesOpen && (
				<ReceivedInvitesModal
					invites={receivedInvites}
					status={receivedInvitesStatus}
					error={receivedInvitesError}
					processingInvite={processingInvite}
					onClose={() => setReceivedInvitesOpen(false)}
					onRetry={() => void loadReceivedInvites()}
					onAccept={invite => void handleInviteAction(invite, 'accept')}
					onReject={invite => void handleInviteAction(invite, 'reject')}
				/>
			)}

			<div
				className={twMerge(
					'pointer-events-none fixed right-5.5 bottom-5.5 z-80 flex min-w-72.5 max-w-[calc(100%-44px)] translate-y-4.5 items-center gap-2.5 rounded-xl border border-l-4 border-(--workspace-border) border-l-brand-500 bg-(--workspace-surface) px-3.5 py-3.25 text-[11px] text-(--workspace-text) opacity-0 shadow-(--workspace-shadow-app) transition duration-200',
					toast && 'pointer-events-auto translate-y-0 opacity-100'
				)}
				role="status"
				aria-live="polite">
				<span className="grid size-5.75 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
					<MdCheck className="size-3.75" aria-hidden="true" />
				</span>
				<span className="flex-1">{toast}</span>
				<button
					className="grid size-7 place-items-center rounded-lg bg-transparent p-0 text-(--workspace-soft) transition hover:bg-(--workspace-surface-hover)"
					type="button"
					aria-label="Fechar"
					onClick={() => setToast('')}>
					<MdClose className="size-4.5" aria-hidden="true" />
				</button>
			</div>
		</div>
	);
};
