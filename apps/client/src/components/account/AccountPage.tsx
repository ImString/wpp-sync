import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
	MdArrowBack,
	MdBusiness,
	MdCheck,
	MdClose,
	MdEmail,
	MdGridView,
	MdInfoOutline,
	MdMenu,
	MdNotificationsNone,
	MdOutlineCameraAlt,
	MdOutlinePerson,
	MdPhone
} from 'react-icons/md';
import { useNavigate, useParams } from 'react-router-dom';

import { getResponseErrors, getResponseMessage, userAPI } from '@/utils/api';

import { Brand } from '@/components/brand';
import { Button } from '@/components/buttons';
import { Sidebar, SidebarBackdrop } from '@/components/chat/sidebar';
import { useChatStore } from '@/components/chat/store';
import { ThemeSwitcher } from '@/components/interface';
import { Image } from '@/components/shared/Image';
import { useAuthenticationStore, useWorkspaceStore } from '@/stores';

interface AccountForm {
	name: string;
	phone: string;
	enterprise: string;
}

interface AccountErrors {
	name?: string;
	phone?: string;
	enterprise?: string;
	avatar?: string;
}

interface Feedback {
	type: 'success' | 'error' | 'info';
	message: string;
}

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const SUPPORTED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const normalizePhone = (value: string) => {
	const trimmedValue = value.trim();
	const prefix = trimmedValue.startsWith('+') ? '+' : '';
	return `${prefix}${trimmedValue.replace(/\D/g, '')}`;
};

const getRoleLabel = (role?: string) => {
	if (role === 'ADMIN') return 'Administrador';
	if (role === 'AGENT') return 'Atendente';
	if (role === 'MEMBER') return 'Membro';
	return 'Usuário';
};

export const AccountPage: React.FC = () => {
	const navigate = useNavigate();
	const { uid: routeWorkspaceUid } = useParams<{ uid: string }>();
	const avatarInputRef = useRef<HTMLInputElement>(null);
	const currentUser = useAuthenticationStore(state => state.currentUser);
	const setCurrentUser = useAuthenticationStore(state => state.setCurrentUser);
	const activeWorkspaceUid = useWorkspaceStore(state => state.activeWorkspaceUid);
	const setActiveWorkspace = useWorkspaceStore(state => state.setActiveWorkspace);
	const openSidebar = useChatStore(state => state.openSidebar);
	const setActiveSection = useChatStore(state => state.setActiveSection);
	const isWorkspaceContext = Boolean(routeWorkspaceUid);
	const workspaceUid = routeWorkspaceUid || activeWorkspaceUid;

	const [form, setForm] = useState<AccountForm>({ name: '', phone: '', enterprise: '' });
	const [avatar, setAvatar] = useState<File | null>(null);
	const [errors, setErrors] = useState<AccountErrors>({});
	const [feedback, setFeedback] = useState<Feedback | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const avatarPreviewUrl = useMemo(() => (avatar ? URL.createObjectURL(avatar) : null), [avatar]);

	useEffect(() => {
		if (routeWorkspaceUid) setActiveWorkspace(routeWorkspaceUid);
	}, [routeWorkspaceUid, setActiveWorkspace]);

	useEffect(() => {
		if (!currentUser) return;
		setForm({
			name: currentUser.name || '',
			phone: currentUser.phone || '',
			enterprise: currentUser.enterprise || ''
		});
	}, [currentUser]);

	useEffect(() => {
		const previousTitle = document.title;
		const bodyClassName = isWorkspaceContext ? 'chat-page' : 'workspace-page';
		document.title = 'Minha conta — WppSync';
		document.body.classList.add(bodyClassName);
		if (isWorkspaceContext) setActiveSection('settings');

		return () => {
			document.title = previousTitle;
			document.body.classList.remove(bodyClassName);
		};
	}, [isWorkspaceContext, setActiveSection]);

	useEffect(() => {
		return () => {
			if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
		};
	}, [avatarPreviewUrl]);

	useEffect(() => {
		if (!feedback) return;
		const timeout = window.setTimeout(() => setFeedback(null), 4200);
		return () => window.clearTimeout(timeout);
	}, [feedback]);

	const normalizedForm = {
		name: form.name.trim(),
		phone: normalizePhone(form.phone),
		enterprise: form.enterprise.trim()
	};

	const isDirty = Boolean(
		avatar ||
		normalizedForm.name !== (currentUser?.name || '') ||
		normalizedForm.phone !== (currentUser?.phone || '') ||
		normalizedForm.enterprise !== (currentUser?.enterprise || '')
	);

	const updateField = (field: keyof AccountForm, value: string) => {
		setForm(current => ({ ...current, [field]: value }));
		setErrors(current => ({ ...current, [field]: undefined }));
	};

	const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		event.target.value = '';
		if (!file) return;

		if (!SUPPORTED_AVATAR_TYPES.includes(file.type)) {
			setErrors(current => ({ ...current, avatar: 'Use uma imagem JPG, PNG ou WEBP.' }));
			return;
		}

		if (file.size > MAX_AVATAR_SIZE) {
			setErrors(current => ({ ...current, avatar: 'A imagem deve ter no máximo 5 MB.' }));
			return;
		}

		setAvatar(file);
		setErrors(current => ({ ...current, avatar: undefined }));
	};

	const validate = () => {
		const nextErrors: AccountErrors = {};

		if (normalizedForm.name.length < 2) nextErrors.name = 'Informe ao menos 2 caracteres.';
		else if (normalizedForm.name.length > 64) nextErrors.name = 'Use no máximo 64 caracteres.';

		if (normalizedForm.phone && !/^\+?[0-9]{10,15}$/.test(normalizedForm.phone)) {
			nextErrors.phone = 'Informe o DDD e o número, com 10 a 15 dígitos.';
		}

		if (normalizedForm.enterprise.length > 128) {
			nextErrors.enterprise = 'Use no máximo 128 caracteres.';
		}

		setErrors(nextErrors);
		return Object.keys(nextErrors).length === 0;
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setFeedback(null);

		if (!currentUser || !validate()) return;
		if (!isDirty) {
			setFeedback({ type: 'info', message: 'Nenhuma alteração para salvar.' });
			return;
		}

		const data = new FormData();
		if (normalizedForm.name !== currentUser.name) data.append('name', normalizedForm.name);
		if (normalizedForm.phone !== (currentUser.phone || '')) {
			data.append('phone', normalizedForm.phone || 'null');
		}
		if (normalizedForm.enterprise !== (currentUser.enterprise || '')) {
			data.append('enterprise', normalizedForm.enterprise || 'null');
		}
		if (avatar) data.append('avatar', avatar);

		if ([...data.keys()].length === 0) {
			setFeedback({ type: 'info', message: 'Preencha o dado que deseja alterar.' });
			return;
		}

		setIsSubmitting(true);

		try {
			const response = await userAPI.updateProfile(data);

			if (!response.success || !response.data) {
				const responseErrors = getResponseErrors(response);
				setErrors(current => ({ ...current, ...responseErrors }));
				setFeedback({
					type: 'error',
					message: getResponseMessage(response, 'Não foi possível salvar suas alterações.')
				});
				return;
			}

			setCurrentUser(response.data);
			setAvatar(null);
			setFeedback({ type: 'success', message: 'Perfil atualizado com sucesso.' });
		} catch {
			setFeedback({ type: 'error', message: 'Não foi possível conectar ao servidor. Tente novamente.' });
		} finally {
			setIsSubmitting(false);
		}
	};

	const goBack = () => navigate(isWorkspaceContext && workspaceUid ? `/w/${workspaceUid}` : '/');

	return (
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
							className="min-h-10 gap-2 px-3 text-[10px] max-[520px]:size-10 max-[520px]:px-0"
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
							<span className="max-w-32 truncate text-[10px] font-semibold text-(--workspace-text) max-[680px]:hidden">
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
									Configurações da conta
								</strong>
								<span className="hidden text-[10px] text-slate-500 dark:text-slate-400 mobile:block">
									Perfil e informações pessoais
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
					<div className="mx-auto w-full max-w-[1080px] px-4 py-7 mobile:px-7 mobile:py-9">
						<section className="mb-6 flex items-start gap-3.5 mobile:mb-7 mobile:items-center">
							<span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-brand-100 bg-brand-50 text-brand-700 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-400 mobile:size-12">
								<MdOutlinePerson className="size-5" aria-hidden="true" />
							</span>
							<div>
								<span className="mb-0.5 block text-[9px] font-extrabold uppercase tracking-[.12em] text-brand-700 dark:text-brand-400">
									Conta e perfil
								</span>
								<h1 className="m-0 text-2xl font-bold tracking-[-.045em] text-slate-950 dark:text-white mobile:text-[30px]">
									Configure sua conta
								</h1>
								<p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400 mobile:text-xs">
									Mantenha seus dados atualizados para que sua equipe reconheça você facilmente.
								</p>
							</div>
						</section>

						<div className="grid items-start gap-5 wide:grid-cols-[minmax(0,1fr)_290px]">
							<section className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-panel dark:border-[#223138] dark:bg-[#0e181e]">
								<header className="border-b border-slate-200 px-5 py-4.5 dark:border-[#223138] mobile:px-6">
									<h2 className="m-0 text-sm font-bold text-slate-900 dark:text-white">
										Informações pessoais
									</h2>
									<p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
										Esses dados aparecem para os membros das suas áreas de trabalho.
									</p>
								</header>

								<div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 dark:border-[#223138] mobile:flex-row mobile:items-center mobile:px-6">
									<div className="relative size-21 shrink-0">
										<Image
											className="size-21 rounded-full border-4 border-white object-cover shadow-[0_8px_24px_rgba(15,23,42,.14)] dark:border-[#17262e]"
											src={avatarPreviewUrl || currentUser?.avatarUrl || undefined}
											seed={form.name || currentUser?.name}
											collection="initials"
										/>
										<span className="absolute -right-0.5 bottom-0 grid size-7 place-items-center rounded-full border-2 border-white bg-brand-600 text-white dark:border-[#0e181e]">
											<MdOutlineCameraAlt className="size-3.5" aria-hidden="true" />
										</span>
									</div>
									<div className="min-w-0 flex-1">
										<strong className="block text-xs text-slate-900 dark:text-white">
											Foto do perfil
										</strong>
										<p className="mt-1 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
											JPG, PNG ou WEBP. A imagem será ajustada para um formato quadrado de até 512
											px.
										</p>
										<div className="mt-3 flex flex-wrap gap-2">
											<Button
												theme="secondary"
												type="button"
												className="min-h-9 px-3 text-[10px]"
												onClick={() => avatarInputRef.current?.click()}>
												<MdOutlineCameraAlt aria-hidden="true" />
												{avatar ? 'Escolher outra' : 'Trocar foto'}
											</Button>
											{avatar && (
												<Button
													theme="ghost"
													type="button"
													className="min-h-9 px-3 text-[10px]"
													onClick={() => setAvatar(null)}>
													Cancelar
												</Button>
											)}
											<input
												ref={avatarInputRef}
												className="sr-only"
												type="file"
												accept="image/jpeg,image/png,image/webp"
												onChange={handleAvatarChange}
											/>
										</div>
										{errors.avatar && (
											<p className="mt-2 text-[10px] font-medium text-red-600 dark:text-red-400">
												{errors.avatar}
											</p>
										)}
									</div>
								</div>

								<form onSubmit={handleSubmit}>
									<div className="grid gap-4 px-5 py-5 mobile:grid-cols-2 mobile:px-6 mobile:py-6">
										<label className="grid gap-1.5 text-[10px] font-semibold text-slate-700 dark:text-slate-200">
											<span>Nome completo</span>
											<span className="relative flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 transition focus-within:border-brand-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-500/10 dark:border-[#2a3a42] dark:bg-[#131f26] dark:focus-within:bg-[#0e181e]">
												<MdOutlinePerson
													className="mx-3 size-4.5 shrink-0"
													aria-hidden="true"
												/>
												<input
													className="h-full min-w-0 flex-1 border-0 bg-transparent pr-3 text-xs font-normal text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
													type="text"
													value={form.name}
													maxLength={64}
													autoComplete="name"
													onChange={event => updateField('name', event.target.value)}
												/>
											</span>
											<span className="min-h-3 text-[9px] font-medium text-red-600 dark:text-red-400">
												{errors.name}
											</span>
										</label>

										<label className="grid gap-1.5 text-[10px] font-semibold text-slate-700 dark:text-slate-200">
											<span>E-mail de acesso</span>
											<span className="relative flex h-11 items-center rounded-xl border border-slate-200 bg-slate-100 text-slate-400 dark:border-[#223138] dark:bg-[#101c22]">
												<MdEmail className="mx-3 size-4.5 shrink-0" aria-hidden="true" />
												<input
													className="h-full min-w-0 flex-1 cursor-not-allowed border-0 bg-transparent pr-3 text-xs font-normal text-slate-500 outline-none dark:text-slate-400"
													type="email"
													value={currentUser?.email || ''}
													disabled
												/>
											</span>
											<span className="min-h-3 text-[9px] font-normal text-slate-400">
												Usado para entrar na sua conta.
											</span>
										</label>

										<label className="grid gap-1.5 text-[10px] font-semibold text-slate-700 dark:text-slate-200">
											<span>Telefone</span>
											<span className="relative flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 transition focus-within:border-brand-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-500/10 dark:border-[#2a3a42] dark:bg-[#131f26] dark:focus-within:bg-[#0e181e]">
												<MdPhone className="mx-3 size-4.5 shrink-0" aria-hidden="true" />
												<input
													className="h-full min-w-0 flex-1 border-0 bg-transparent pr-3 text-xs font-normal text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
													type="tel"
													placeholder="Ex.: +55 11 99999-9999"
													value={form.phone}
													maxLength={22}
													autoComplete="tel"
													onChange={event => updateField('phone', event.target.value)}
												/>
											</span>
											<span className="min-h-3 text-[9px] font-medium text-red-600 dark:text-red-400">
												{errors.phone}
											</span>
										</label>

										<label className="grid gap-1.5 text-[10px] font-semibold text-slate-700 dark:text-slate-200">
											<span>Empresa</span>
											<span className="relative flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 transition focus-within:border-brand-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-500/10 dark:border-[#2a3a42] dark:bg-[#131f26] dark:focus-within:bg-[#0e181e]">
												<MdBusiness className="mx-3 size-4.5 shrink-0" aria-hidden="true" />
												<input
													className="h-full min-w-0 flex-1 border-0 bg-transparent pr-3 text-xs font-normal text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
													type="text"
													placeholder="Nome da sua empresa"
													value={form.enterprise}
													maxLength={128}
													autoComplete="organization"
													onChange={event => updateField('enterprise', event.target.value)}
												/>
											</span>
											<span className="min-h-3 text-[9px] font-medium text-red-600 dark:text-red-400">
												{errors.enterprise}
											</span>
										</label>
									</div>

									<footer className="flex flex-col-reverse items-stretch justify-end gap-2 border-t border-slate-200 bg-slate-50/70 px-5 py-4 dark:border-[#223138] dark:bg-[#101b21] mobile:flex-row mobile:items-center mobile:px-6">
										<Button
											theme="secondary"
											type="button"
											className="min-h-10 text-[11px]"
											onClick={goBack}>
											Cancelar
										</Button>
										<Button
											theme="primary"
											type="submit"
											className="min-h-10 text-[11px]"
											loading={isSubmitting}
											loadingLabel="Salvando..."
											disabled={!isDirty}>
											<MdCheck aria-hidden="true" />
											Salvar alterações
										</Button>
									</footer>
								</form>
							</section>

							<aside className="grid gap-4">
								<section className="overflow-hidden rounded-[20px] border border-emerald-900/40 bg-[radial-gradient(circle_at_top_right,rgba(37,211,102,.17),transparent_46%),linear-gradient(145deg,#073b32,#04251f)] p-5 text-emerald-50 shadow-panel">
									<span className="text-[9px] font-extrabold uppercase tracking-[.12em] text-brand-400">
										Prévia do perfil
									</span>
									<div className="mt-5 flex items-center gap-3">
										<Image
											className="size-12 shrink-0 rounded-full border-2 border-white/15 object-cover"
											src={avatarPreviewUrl || currentUser?.avatarUrl || undefined}
											seed={form.name || currentUser?.name}
											collection="initials"
										/>
										<div className="min-w-0">
											<strong className="block truncate text-sm">
												{form.name.trim() || 'Seu nome'}
											</strong>
											<span className="block truncate text-[10px] text-emerald-100/60">
												{form.enterprise.trim() || getRoleLabel(currentUser?.role)}
											</span>
										</div>
									</div>
									<div className="mt-5 grid gap-2 border-t border-white/10 pt-4 text-[10px] text-emerald-100/65">
										<div className="flex items-center gap-2">
											<MdEmail className="size-4 text-brand-400" aria-hidden="true" />
											<span className="truncate">{currentUser?.email}</span>
										</div>
										<div className="flex items-center gap-2">
											<MdPhone className="size-4 text-brand-400" aria-hidden="true" />
											<span className="truncate">{form.phone || 'Telefone não informado'}</span>
										</div>
									</div>
								</section>

								<section className="rounded-[17px] border border-slate-200 bg-white p-4 dark:border-[#223138] dark:bg-[#0e181e]">
									<div className="flex gap-2.5">
										<MdInfoOutline
											className="mt-0.5 size-4.5 shrink-0 text-brand-600 dark:text-brand-400"
											aria-hidden="true"
										/>
										<div>
											<strong className="block text-[11px] text-slate-800 dark:text-slate-100">
												Seus dados, sempre sincronizados
											</strong>
											<p className="mt-1 text-[9px] leading-4 text-slate-500 dark:text-slate-400">
												A alteração será refletida em todas as áreas de trabalho vinculadas à
												sua conta.
											</p>
										</div>
									</div>
								</section>
							</aside>
						</div>
					</div>
				</div>
			</main>

			{feedback && (
				<div
					role={feedback.type === 'error' ? 'alert' : 'status'}
					className="fixed bottom-4 right-4 z-70 flex max-w-[calc(100vw-32px)] items-center gap-2.5 rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-[11px] text-slate-700 shadow-[0_18px_54px_rgba(15,23,42,.2)] dark:border-[#2a3a42] dark:bg-[#131f26] dark:text-slate-100">
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
					{feedback.message}
				</div>
			)}
		</div>
	);
};
