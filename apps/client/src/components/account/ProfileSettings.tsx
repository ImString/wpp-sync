import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
	MdBusiness,
	MdCheck,
	MdEmail,
	MdInfoOutline,
	MdOutlineCameraAlt,
	MdOutlinePerson,
	MdPhone
} from 'react-icons/md';
import { useShallow } from 'zustand/react/shallow';

import { getResponseErrors, getResponseMessage, userAPI } from '@/utils/api';

import { Button } from '@/components/buttons';
import { Image } from '@/components/shared/Image';
import { useAuthenticationStore } from '@/stores';

import type { SettingsFeedback } from './types';

interface ProfileSettingsProps {
	onFeedback: (feedback: SettingsFeedback) => void;
}

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

const fieldClassName =
	'relative flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 transition focus-within:border-brand-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-500/10 dark:border-[#2a3a42] dark:bg-[#131f26] dark:focus-within:bg-[#0e181e]';

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ onFeedback }) => {
	const avatarInputRef = useRef<HTMLInputElement>(null);
	const { currentUser, setCurrentUser } = useAuthenticationStore(
		useShallow(state => ({
			currentUser: state.currentUser,
			setCurrentUser: state.setCurrentUser
		}))
	);
	const [form, setForm] = useState<AccountForm>({ name: '', phone: '', enterprise: '' });
	const [avatar, setAvatar] = useState<File | null>(null);
	const [errors, setErrors] = useState<AccountErrors>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const avatarPreviewUrl = useMemo(() => (avatar ? URL.createObjectURL(avatar) : null), [avatar]);

	useEffect(() => {
		if (!currentUser) return;
		setForm({
			name: currentUser.name || '',
			phone: currentUser.phone || '',
			enterprise: currentUser.enterprise || ''
		});
	}, [currentUser]);

	useEffect(() => {
		return () => {
			if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
		};
	}, [avatarPreviewUrl]);

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

	const resetForm = () => {
		setForm({
			name: currentUser?.name || '',
			phone: currentUser?.phone || '',
			enterprise: currentUser?.enterprise || ''
		});
		setAvatar(null);
		setErrors({});
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

		if (normalizedForm.enterprise.length > 128) nextErrors.enterprise = 'Use no máximo 128 caracteres.';

		setErrors(nextErrors);
		return Object.keys(nextErrors).length === 0;
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!currentUser || !validate()) return;
		if (!isDirty) {
			onFeedback({ type: 'info', message: 'Nenhuma alteração para salvar.' });
			return;
		}

		const data = new FormData();
		if (normalizedForm.name !== currentUser.name) data.append('name', normalizedForm.name);
		if (normalizedForm.phone !== (currentUser.phone || '')) data.append('phone', normalizedForm.phone || 'null');
		if (normalizedForm.enterprise !== (currentUser.enterprise || '')) {
			data.append('enterprise', normalizedForm.enterprise || 'null');
		}
		if (avatar) data.append('avatar', avatar);

		setIsSubmitting(true);

		try {
			const response = await userAPI.updateProfile(data);

			if (!response.success || !response.data) {
				setErrors(current => ({ ...current, ...getResponseErrors(response) }));
				onFeedback({
					type: 'error',
					message: getResponseMessage(response, 'Não foi possível salvar suas alterações.')
				});
				return;
			}

			setCurrentUser(response.data);
			setAvatar(null);
			onFeedback({ type: 'success', message: 'Perfil atualizado com sucesso.' });
		} catch {
			onFeedback({ type: 'error', message: 'Não foi possível conectar ao servidor. Tente novamente.' });
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="grid items-start gap-5 wide:grid-cols-[minmax(0,1fr)_270px]">
			<section className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-panel dark:border-[#223138] dark:bg-[#0e181e]">
				<header className="border-b border-slate-200 px-5 py-4.5 dark:border-[#223138] mobile:px-6">
					<h2 className="m-0 text-sm font-bold text-slate-900 dark:text-white">Informações pessoais</h2>
					<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
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
						<strong className="block text-xs text-slate-900 dark:text-white">Foto do perfil</strong>
						<p className="mt-1 text-xs leading-4 text-slate-500 dark:text-slate-400">
							JPG, PNG ou WEBP, com até 5 MB.
						</p>
						<div className="mt-3 flex flex-wrap gap-2">
							<Button
								theme="secondary"
								type="button"
								className="min-h-9 px-3 text-xs"
								onClick={() => avatarInputRef.current?.click()}>
								<MdOutlineCameraAlt aria-hidden="true" />
								{avatar ? 'Escolher outra' : 'Trocar foto'}
							</Button>
							{avatar && (
								<Button
									theme="ghost"
									type="button"
									className="min-h-9 px-3 text-xs"
									onClick={() => setAvatar(null)}>
									Remover seleção
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
							<p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">{errors.avatar}</p>
						)}
					</div>
				</div>

				<form onSubmit={handleSubmit}>
					<div className="grid gap-4 px-5 py-5 mobile:grid-cols-2 mobile:px-6 mobile:py-6">
						<label className="grid gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
							<span>Nome completo</span>
							<span className={fieldClassName}>
								<MdOutlinePerson className="mx-3 size-4.5 shrink-0" aria-hidden="true" />
								<input
									className="h-full min-w-0 flex-1 border-0 bg-transparent pr-3 text-xs font-normal text-slate-900 outline-none dark:text-white"
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

						<label className="grid gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
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

						<label className="grid gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
							<span>Telefone</span>
							<span className={fieldClassName}>
								<MdPhone className="mx-3 size-4.5 shrink-0" aria-hidden="true" />
								<input
									className="h-full min-w-0 flex-1 border-0 bg-transparent pr-3 text-xs font-normal text-slate-900 outline-none dark:text-white"
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

						<label className="grid gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
							<span>Empresa</span>
							<span className={fieldClassName}>
								<MdBusiness className="mx-3 size-4.5 shrink-0" aria-hidden="true" />
								<input
									className="h-full min-w-0 flex-1 border-0 bg-transparent pr-3 text-xs font-normal text-slate-900 outline-none dark:text-white"
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
							disabled={!isDirty}
							onClick={resetForm}>
							Descartar
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
							<strong className="block truncate text-sm">{form.name.trim() || 'Seu nome'}</strong>
							<span className="block truncate text-xs text-emerald-100/60">
								{form.enterprise.trim() || getRoleLabel(currentUser?.role)}
							</span>
						</div>
					</div>
					<div className="mt-5 grid gap-2 border-t border-white/10 pt-4 text-xs text-emerald-100/65">
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
								A alteração será refletida em todas as áreas de trabalho vinculadas à sua conta.
							</p>
						</div>
					</div>
				</section>
			</aside>
		</div>
	);
};
