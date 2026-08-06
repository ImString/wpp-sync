import { useEffect, useState } from 'react';
import type { IconType } from 'react-icons';
import {
	MdArrowBack,
	MdChevronRight,
	MdCheck,
	MdClose,
	MdGridView,
	MdGroups,
	MdInfoOutline,
	MdMenu,
	MdNotificationsNone,
	MdOutlinePerson,
	MdOutlineWorkspaces,
	MdSettings
} from 'react-icons/md';
import { useNavigate, useParams } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import { useShallow } from 'zustand/react/shallow';

import { getResponseMessage, workspaceAPI, type WorkspaceMemberRole } from '@/utils/api';

import { Brand } from '@/components/brand';
import { Button } from '@/components/buttons';
import { Sidebar, SidebarBackdrop } from '@/components/chat/sidebar';
import { useChatStore } from '@/components/chat/store';
import { ThemeSwitcher } from '@/components/interface';
import { RouteManagerRoute } from '@/components/routerManager';
import { Image } from '@/components/shared/Image';
import { useAuthenticationStore, useWorkspaceStore } from '@/stores';

import { MembersSettings } from './MembersSettings';
import { ProfileSettings } from './ProfileSettings';
import { WorkspaceSettings } from './WorkspaceSettings';
import type { SettingsFeedback } from './types';

type SettingsSection = 'profile' | 'workspace' | 'members';

interface SectionDefinition {
	id: SettingsSection;
	label: string;
	description: string;
	eyebrow: string;
	title: string;
	icon: IconType;
}

const sections: SectionDefinition[] = [
	{
		id: 'profile',
		label: 'Meu perfil',
		description: 'Dados pessoais e foto',
		eyebrow: 'Conta pessoal',
		title: 'Meu perfil',
		icon: MdOutlinePerson
	},
	{
		id: 'workspace',
		label: 'Área de trabalho',
		description: 'Nome e identidade visual',
		eyebrow: 'Organização',
		title: 'Área de trabalho',
		icon: MdOutlineWorkspaces
	},
	{
		id: 'members',
		label: 'Membros',
		description: 'Equipe, acessos e convites',
		eyebrow: 'Equipe e acesso',
		title: 'Gerenciar membros',
		icon: MdGroups
	}
];

const isSettingsSection = (value?: string): value is SettingsSection =>
	value === 'profile' || value === 'workspace' || value === 'members';

export const AccountPage: React.FC = () => {
	const navigate = useNavigate();

	const { uid: routeWorkspaceUid, settingsSection } = useParams<{
		uid: string;
		settingsSection: string;
	}>();

	const currentUser = useAuthenticationStore(state => state.currentUser);
	const { workspaces, activeWorkspaceUid, getWorkspace, setActiveWorkspace } = useWorkspaceStore(
		useShallow(state => ({
			workspaces: state.workspaces,
			activeWorkspaceUid: state.activeWorkspaceUid,
			getWorkspace: state.getWorkspace,
			setActiveWorkspace: state.setActiveWorkspace
		}))
	);
	const { openSidebar, setActiveSection } = useChatStore(
		useShallow(state => ({
			openSidebar: state.openSidebar,
			setActiveSection: state.setActiveSection
		}))
	);
	const [workspaceRole, setWorkspaceRole] = useState<WorkspaceMemberRole | null>(null);
	const [feedback, setFeedback] = useState<SettingsFeedback | null>(null);
	const isWorkspaceContext = Boolean(routeWorkspaceUid);
	const workspaceUid = routeWorkspaceUid || activeWorkspaceUid;
	const workspace = workspaces.find(item => item.uid === workspaceUid);
	const requestedSection = isSettingsSection(settingsSection) ? settingsSection : 'profile';
	const isWorkspaceOwner = workspaceRole === 'OWNER';
	const availableSections = sections.filter(section => section.id !== 'workspace' || isWorkspaceOwner);
	const activeSettingsSection = isWorkspaceContext
		? requestedSection === 'workspace' && workspaceRole && !isWorkspaceOwner
			? 'members'
			: requestedSection
		: 'profile';
	const activeDefinition = sections.find(section => section.id === activeSettingsSection) || sections[0];

	useEffect(() => {
		if (!routeWorkspaceUid) {
			setWorkspaceRole(null);
			return;
		}

		const controller = new AbortController();
		setActiveWorkspace(routeWorkspaceUid);
		setWorkspaceRole(null);

		void Promise.all([
			getWorkspace(routeWorkspaceUid, controller.signal),
			workspaceAPI.getMembership(routeWorkspaceUid, controller.signal)
		])
			.then(([, membershipResponse]) => {
				if (!membershipResponse.success || !membershipResponse.data) {
					throw new Error(
						getResponseMessage(membershipResponse, 'Não foi possível carregar suas permissões nesta área.')
					);
				}

				setWorkspaceRole(membershipResponse.data.role || 'MEMBER');
			})
			.catch(error => {
				if (controller.signal.aborted) return;
				setWorkspaceRole('MEMBER');
				setFeedback({
					type: 'error',
					message: error instanceof Error ? error.message : 'Não foi possível carregar a área de trabalho.'
				});
			});

		return () => controller.abort();
	}, [getWorkspace, routeWorkspaceUid, setActiveWorkspace]);

	useEffect(() => {
		if (!routeWorkspaceUid || !workspaceRole) return;
		if (requestedSection !== 'workspace' || isWorkspaceOwner) return;

		navigate(`/w/${routeWorkspaceUid}/settings/members`, { replace: true });
	}, [isWorkspaceOwner, navigate, requestedSection, routeWorkspaceUid, workspaceRole]);

	useEffect(() => {
		if (isWorkspaceContext) setActiveSection('settings');
	}, [isWorkspaceContext, setActiveSection]);

	useEffect(() => {
		if (!feedback) return;
		const timeout = window.setTimeout(() => setFeedback(null), 4200);
		return () => window.clearTimeout(timeout);
	}, [feedback]);

	const goBack = () => navigate(isWorkspaceContext && workspaceUid ? `/w/${workspaceUid}` : '/');

	const navigateToSection = (section: SettingsSection) => {
		if (!isWorkspaceContext || !workspaceUid) return;
		if (section === 'workspace' && !isWorkspaceOwner) return;
		navigate(`/w/${workspaceUid}/settings/${section}`);
	};

	return (
		<RouteManagerRoute
			title="Configurações"
			context={activeDefinition.label}
			bodyClassName={isWorkspaceContext ? 'chat-page' : 'workspace-page'}>
			<div
				className={
					isWorkspaceContext
						? 'grid h-dvh grid-cols-1 p-0 drawer:grid-cols-[220px_minmax(0,1fr)] drawer:p-4.5'
						: 'workspace-app relative isolate min-h-dvh'
				}>
				{isWorkspaceContext ? (
					<>
						<SidebarBackdrop />
						<Sidebar />
					</>
				) : (
					<header className="sticky top-0 z-30 flex min-h-18 items-center justify-between gap-4 border-b border-(--workspace-border) bg-(--workspace-header) px-[max(24px,calc((100vw-1180px)/2))] backdrop-blur-[18px] max-[980px]:px-5 max-[680px]:min-h-16 max-[680px]:px-3.5">
						<Brand
							className="gap-2.5"
							markClassName="size-9 max-[680px]:size-8"
							nameClassName="text-[21px] font-extrabold tracking-[-.055em] text-[var(--workspace-text)] max-[680px]:text-[19px]"
						/>

						<div className="flex min-w-0 items-center gap-1.5">
							<Button
								theme="secondary"
								type="button"
								className="min-h-10 gap-2 px-3 text-xs max-[520px]:size-10 max-[520px]:px-0"
								onClick={goBack}>
								<MdGridView className="size-4.5" aria-hidden="true" />
								<span className="max-[520px]:sr-only">Áreas de trabalho</span>
							</Button>
							<ThemeSwitcher className="size-10 min-h-10 rounded-xl p-0 text-xl" />
							<div className="flex min-w-0 items-center gap-2 rounded-xl bg-(--workspace-surface-muted) p-1.5 pr-2.5 max-[680px]:pr-1.5">
								<Image
									className="size-8 shrink-0 rounded-full object-cover"
									src={currentUser?.avatarUrl || undefined}
									seed={currentUser?.name}
									collection="initials"
								/>
								<span className="max-w-32 truncate text-xs font-semibold text-(--workspace-text) max-[680px]:hidden">
									{currentUser?.name || 'Usuário'}
								</span>
							</div>
						</div>
					</header>
				)}

				<main
					className={
						isWorkspaceContext
							? 'relative grid min-h-0 grid-rows-[62px_minmax(0,1fr)] overflow-hidden bg-white dark:bg-[#0e181e] mobile:grid-rows-[72px_minmax(0,1fr)] drawer:rounded-r-2xl drawer:border drawer:border-l-0 drawer:border-slate-200 drawer:shadow-app dark:drawer:border-[#223138]'
							: 'relative z-1 min-h-[calc(100dvh-72px)]'
					}>
					{isWorkspaceContext && (
						<header className="flex min-w-0 items-center justify-between gap-3 border-b border-slate-200 px-2.5 dark:border-[#223138] mobile:px-4">
							<div className="flex min-w-0 items-center gap-1.5 mobile:gap-2.5">
								<Button
									theme="ghost"
									type="button"
									aria-label="Abrir menu"
									className="icon-button drawer:hidden"
									onClick={openSidebar}>
									<MdMenu aria-hidden="true" />
								</Button>
								<Button
									theme="ghost"
									type="button"
									aria-label="Voltar"
									className="icon-button"
									onClick={goBack}>
									<MdArrowBack aria-hidden="true" />
								</Button>
								<div className="min-w-0">
									<strong className="block truncate text-xs text-slate-900 dark:text-white mobile:text-sm">
										Configurações
									</strong>
									<span className="hidden text-xs text-slate-500 dark:text-slate-400 mobile:block">
										Perfil, área de trabalho e equipe
									</span>
								</div>
							</div>

							<div className="flex shrink-0 items-center gap-1">
								<Button
									theme="ghost"
									type="button"
									aria-label="Notificações"
									className="icon-button relative hidden mobile:grid">
									<MdNotificationsNone aria-hidden="true" />
									<span className="absolute right-0.5 top-0.5 grid min-w-4.25 place-items-center rounded-full border-2 border-white bg-brand-600 px-1 text-[9px] font-bold text-white dark:border-[#0e181e]">
										3
									</span>
								</Button>
								<ThemeSwitcher className="size-10 min-h-10 rounded-xl p-0 text-xl" />
							</div>
						</header>
					)}

					<div
						className={
							isWorkspaceContext
								? 'scrollbar-thin min-h-0 overflow-y-auto bg-slate-50 dark:bg-[#0b151a]'
								: 'min-h-[calc(100dvh-72px)] bg-transparent'
						}>
						<div className="mx-auto w-full max-w-280 px-4 py-6 mobile:px-7 mobile:py-8">
							<section className="mb-6 flex items-start gap-3.5 mobile:items-center">
								<span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-brand-100 bg-brand-50 text-brand-700 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-400 mobile:size-12">
									<MdSettings className="size-5" aria-hidden="true" />
								</span>
								<div>
									<span className="mb-0.5 block text-[9px] font-extrabold uppercase tracking-[.12em] text-brand-700 dark:text-brand-400">
										Central de configurações
									</span>
									<h1 className="m-0 text-2xl font-bold tracking-[-.045em] text-slate-950 dark:text-white mobile:text-[30px]">
										Configurações
									</h1>
									<p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400 mobile:text-xs">
										Gerencie seu perfil, a identidade da área e o acesso da sua equipe.
									</p>
								</div>
							</section>

							<div
								className={twMerge(
									'grid items-start gap-5',
									isWorkspaceContext && 'drawer:grid-cols-[220px_minmax(0,1fr)]'
								)}>
								{isWorkspaceContext && (
									<aside className="overflow-hidden rounded-[18px] border border-slate-200 bg-white p-2 shadow-panel dark:border-[#223138] dark:bg-[#0e181e] drawer:sticky drawer:top-0">
										<div className="mb-1 border-b border-slate-100 px-3 py-3 dark:border-[#1b2a31]">
											<span className="block text-[9px] font-bold uppercase tracking-widest text-slate-400">
												Configurar
											</span>
											<strong className="mt-1 block truncate text-[11px] text-slate-800 dark:text-slate-100">
												{workspace?.name || 'Área de trabalho'}
											</strong>
										</div>
										<nav
											className="grid grid-cols-3 gap-1 drawer:grid-cols-1"
											aria-label="Seções das configurações">
											{availableSections.map(section => {
												const Icon = section.icon;
												const isActive = section.id === activeSettingsSection;
												return (
													<button
														key={section.id}
														type="button"
														aria-current={isActive ? 'page' : undefined}
														className={twMerge(
															'group flex min-w-0 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl px-1.5 py-2 text-center transition drawer:flex-row drawer:justify-start drawer:gap-2.5 drawer:px-3 drawer:py-2.5 drawer:text-left',
															isActive
																? 'bg-brand-50 text-brand-800 dark:bg-brand-500/10 dark:text-brand-400'
																: 'text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-[#131f26] dark:hover:text-white'
														)}
														onClick={() => navigateToSection(section.id)}>
														<span
															className={twMerge(
																'grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-[#17262e] dark:text-slate-400',
																isActive &&
																	'bg-white text-brand-700 shadow-sm dark:bg-brand-500/15 dark:text-brand-400'
															)}>
															<Icon className="size-4" aria-hidden="true" />
														</span>
														<span className="min-w-0">
															<strong className="block text-[9px] font-bold leading-3 drawer:truncate drawer:text-xs">
																{section.label}
															</strong>
															<small className="mt-0.5 hidden truncate text-[8px] font-normal opacity-70 drawer:block">
																{section.description}
															</small>
														</span>
														<MdChevronRight
															className={twMerge(
																'ml-auto hidden size-4 opacity-0 transition drawer:block',
																isActive && 'opacity-100'
															)}
															aria-hidden="true"
														/>
													</button>
												);
											})}
										</nav>
									</aside>
								)}

								<div className="min-w-0">
									<header className="mb-4">
										<span className="text-[9px] font-extrabold uppercase tracking-widest text-brand-700 dark:text-brand-400">
											{activeDefinition.eyebrow}
										</span>
										<h2 className="mt-1 text-lg font-bold tracking-[-.03em] text-slate-950 dark:text-white mobile:text-xl">
											{activeDefinition.title}
										</h2>
										<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
											{activeDefinition.description}
										</p>
									</header>

									{activeSettingsSection === 'profile' && (
										<ProfileSettings onFeedback={setFeedback} />
									)}
									{activeSettingsSection === 'workspace' && isWorkspaceOwner && (
										<WorkspaceSettings workspace={workspace} onFeedback={setFeedback} />
									)}
									{activeSettingsSection === 'members' && (
										<MembersSettings
											currentUser={currentUser}
											workspace={workspace}
											workspaceUid={workspaceUid || undefined}
											currentUserRole={workspaceRole}
											onCurrentUserRoleChange={setWorkspaceRole}
											onFeedback={setFeedback}
										/>
									)}
								</div>
							</div>
						</div>
					</div>
				</main>

				{feedback && (
					<div
						role={feedback.type === 'error' ? 'alert' : 'status'}
						className="fixed bottom-4 right-4 z-90 flex max-w-[calc(100vw-32px)] items-center gap-2.5 rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-[11px] text-slate-700 shadow-[0_18px_54px_rgba(15,23,42,.2)] dark:border-[#2a3a42] dark:bg-[#131f26] dark:text-slate-100">
						<span
							className={`grid size-6 shrink-0 place-items-center rounded-full text-white ${feedback.type === 'error' ? 'bg-red-500' : feedback.type === 'success' ? 'bg-brand-600' : 'bg-slate-500'}`}>
							{feedback.type === 'error' ? (
								<MdClose aria-hidden="true" />
							) : feedback.type === 'success' ? (
								<MdCheck aria-hidden="true" />
							) : (
								<MdInfoOutline aria-hidden="true" />
							)}
						</span>
						<span className="flex-1">{feedback.message}</span>
						<Button
							theme="ghost"
							type="button"
							className="size-7 min-h-7 p-0"
							aria-label="Fechar aviso"
							onClick={() => setFeedback(null)}>
							<MdClose aria-hidden="true" />
						</Button>
					</div>
				)}
			</div>
		</RouteManagerRoute>
	);
};
