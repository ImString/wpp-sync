import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { MdClose, MdEdit, MdLanguage, MdOutlineCameraAlt } from 'react-icons/md';
import { useParams } from 'react-router-dom';

import { getResponseMessage, integrationsAPI } from '@/utils/api';

import { Button } from '@/components/buttons';

import { Image } from '../shared/Image';
import { SiteInstallationCodes } from './SiteInstallationCodes';
import type { Integration } from './types';

interface SiteChannelConfigModalProps {
	integration: Integration;
	onClose: () => void;
	onSaved: (updated: Integration) => void;
}

interface SiteChannelForm {
	name: string;
	headerName: string;
}

interface SiteChannelConfigErrors {
	name?: string;
	headerName?: string;
	avatar?: string;
}

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const SUPPORTED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const fieldClassName =
	'h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white dark:border-[#223138] dark:bg-[#131f26] dark:focus:bg-[#0e181e]';

export const SiteChannelConfigModal: React.FC<SiteChannelConfigModalProps> = props => {
	const { uid } = useParams<{ uid: string }>();
	const avatarInputRef = useRef<HTMLInputElement>(null);

	const webConfig = props.integration.config ?? {};
	const isConnected = props.integration.status === 'CONNECTED';

	const [form, setForm] = useState<SiteChannelForm>({
		name: props.integration.name ?? '',
		headerName: webConfig.headerName ?? ''
	});
	const [currentAvatar, setCurrentAvatar] = useState(webConfig.headerPhoto ?? '');
	const [avatar, setAvatar] = useState<File | null>(null);
	const [avatarRemoved, setAvatarRemoved] = useState(false);

	const [submitted, setSubmitted] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [errors, setErrors] = useState<SiteChannelConfigErrors>({});
	const [errorMessage, setErrorMessage] = useState('');

	const avatarPreviewUrl = useMemo(() => (avatar ? URL.createObjectURL(avatar) : null), [avatar]);
	const displayedAvatar = avatarPreviewUrl || (!avatarRemoved ? currentAvatar : '') || undefined;

	useEffect(() => {
		const integrationConfig = props.integration.config ?? {};

		setForm({
			name: props.integration.name ?? '',
			headerName: integrationConfig.headerName ?? ''
		});
		setCurrentAvatar(integrationConfig.headerPhoto ?? '');
		setAvatar(null);
		setAvatarRemoved(false);
		setSubmitted(false);
		setErrors({});
		setErrorMessage('');
	}, [props.integration]);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && !submitting) props.onClose();
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [props.onClose, submitting]);

	useEffect(() => {
		return () => {
			if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
		};
	}, [avatarPreviewUrl]);

	const updateField = (field: keyof SiteChannelForm, value: string) => {
		setForm(current => ({ ...current, [field]: value }));
		setErrors(current => ({ ...current, [field]: undefined }));
		setErrorMessage('');
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
		setAvatarRemoved(false);
		setErrors(current => ({ ...current, avatar: undefined }));
		setErrorMessage('');
	};

	const handleRemoveAvatar = () => {
		setAvatar(null);
		setAvatarRemoved(true);
		setErrors(current => ({ ...current, avatar: undefined }));
		setErrorMessage('');
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setSubmitted(true);
		setErrorMessage('');

		const name = form.name.trim();
		const headerName = form.headerName.trim();
		const nextErrors: SiteChannelConfigErrors = {};

		if (!name) nextErrors.name = 'Informe um nome para a integração.';
		if (!headerName) nextErrors.headerName = 'Informe o nome exibido no cabeçalho do chat.';

		if (Object.keys(nextErrors).length > 0) {
			setErrors(current => ({ ...current, ...nextErrors }));
			return;
		}

		if (!uid) {
			setErrorMessage('Área de trabalho não encontrada.');
			return;
		}

		setSubmitting(true);

		try {
			const data = new FormData();
			data.append('name', name);
			data.append('headerName', headerName);
			if (avatar) data.append('headerPhoto', avatar);
			if (avatarRemoved) data.append('removeHeaderPhoto', 'true');

			const response = await integrationsAPI.updateWebConfig(uid, props.integration.id, data);

			if (!response.success || !response.data) {
				throw new Error(getResponseMessage(response, 'Não foi possível salvar as configurações.'));
			}

			props.onSaved(response.data);
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : 'Não foi possível salvar as configurações.');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-[3px] mobile:items-center mobile:p-5"
			role="presentation"
			onMouseDown={event => {
				if (event.target === event.currentTarget && !submitting) props.onClose();
			}}>
			<section
				role="dialog"
				aria-modal="true"
				aria-labelledby="site-config-title"
				className="integrations-modal max-h-[94dvh] w-full overflow-y-auto rounded-t-3xl border border-slate-200 bg-white shadow-2xl dark:border-[#223138] dark:bg-[#0e181e] mobile:max-w-140 mobile:rounded-[22px] scrollbar-thin">
				<header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur dark:border-[#223138] dark:bg-[#0e181e]/95 mobile:px-5">
					<div className="flex items-center gap-3">
						<span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-lg text-sky-700 dark:bg-[#0f2838] dark:text-sky-400">
							<MdLanguage aria-hidden="true" />
						</span>
						<div>
							<h2 id="site-config-title" className="text-base font-bold tracking-[-.02em]">
								Configurar Canal de Site
							</h2>
							<p className="mt-1 text-xs leading-4 text-slate-500 dark:text-slate-400">
								Defina como o chat será exibido no seu site.
							</p>
						</div>
					</div>
					<button
						type="button"
						className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/10 dark:hover:text-white"
						aria-label="Fechar"
						disabled={submitting}
						onClick={props.onClose}>
						<MdClose className="size-5" aria-hidden="true" />
					</button>
				</header>

				<form onSubmit={handleSubmit} noValidate>
					<div className="grid gap-5 p-4 mobile:p-5">
						<label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
							Nome <span className="text-red-500">*</span>
							<div className="relative mt-1.5">
								<MdEdit
									className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
									aria-hidden="true"
								/>
								<input
									autoFocus
									value={form.name}
									maxLength={128}
									disabled={submitting}
									onChange={event => updateField('name', event.target.value)}
									placeholder="Ex.: Meu site"
									aria-invalid={Boolean(errors.name)}
									className={`${fieldClassName} pl-9`}
								/>
							</div>
							{(submitted || errors.name) && errors.name && (
								<span className="mt-1 block text-[9px] text-red-500">{errors.name}</span>
							)}
						</label>

						<label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
							Nome no Cabeçalho do Chat <span className="text-red-500">*</span>
							<div className="relative mt-1.5">
								<MdEdit
									className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
									aria-hidden="true"
								/>
								<input
									value={form.headerName}
									maxLength={64}
									disabled={submitting}
									onChange={event => updateField('headerName', event.target.value)}
									placeholder="Ex.: Suporte"
									aria-invalid={Boolean(errors.headerName)}
									className={`${fieldClassName} pl-9`}
								/>
							</div>
							{(submitted || errors.headerName) && errors.headerName && (
								<span className="mt-1 block text-[9px] text-red-500">{errors.headerName}</span>
							)}
						</label>

						<div className="rounded-xl border border-slate-200 dark:border-[#223138]">
							<div className="flex items-center gap-4 p-4">
								<div className="relative size-16 shrink-0 mobile:size-18">
									<Image
										className="size-full rounded-full border-4 border-slate-100 object-cover shadow-[0_5px_14px_rgba(15,23,42,.18)] dark:border-[#17262e]"
										src={displayedAvatar}
										seed={form.headerName || form.name}
										collection="initials"
									/>

									<span className="absolute -right-0.5 bottom-0 grid size-6 place-items-center rounded-full border-2 border-white bg-brand-600 text-white dark:border-[#0e181e]">
										<MdOutlineCameraAlt className="size-3.5" aria-hidden="true" />
									</span>
								</div>

								<div className="min-w-0 flex-1">
									<strong className="block text-xs font-semibold text-slate-900 dark:text-white">
										Foto no Cabeçalho do Chat{' '}
										<span className="font-normal text-slate-400">(opcional)</span>
									</strong>

									<p className="mt-1 text-xs leading-4 text-slate-500 dark:text-slate-400">
										JPG, PNG ou WEBP, com até 5 MB.
									</p>

									<div className="mt-2 flex flex-wrap gap-2">
										<Button
											theme="secondary"
											type="button"
											className="h-9 min-h-9 gap-2 px-3 text-xs"
											disabled={submitting}
											onClick={() => avatarInputRef.current?.click()}>
											<MdOutlineCameraAlt className="size-4" aria-hidden="true" />
											{avatar || currentAvatar ? 'Escolher outra' : 'Escolher foto'}
										</Button>

										{(avatar || (currentAvatar && !avatarRemoved)) && (
											<Button
												theme="ghost"
												type="button"
												className="h-9 min-h-9 px-3 text-xs"
												disabled={submitting}
												onClick={handleRemoveAvatar}>
												Remover
											</Button>
										)}
									</div>

									<input
										ref={avatarInputRef}
										className="sr-only"
										type="file"
										accept="image/jpeg,image/png,image/webp"
										disabled={submitting}
										onChange={handleAvatarChange}
									/>

									{errors.avatar && (
										<p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
											{errors.avatar}
										</p>
									)}
								</div>
							</div>
						</div>

						{isConnected && (
							<SiteInstallationCodes
								workspaceUid={uid ?? ''}
								integrationId={props.integration.id}
								headerName={form.headerName.trim() || 'Atendimento'}
							/>
						)}

						{errorMessage && (
							<p
								role="alert"
								className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
								{errorMessage}
							</p>
						)}
					</div>

					<footer className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3.5 dark:border-[#223138] mobile:px-5">
						<Button
							theme="secondary"
							type="button"
							className="min-w-24"
							disabled={submitting}
							onClick={props.onClose}>
							{isConnected ? 'Fechar' : 'Cancelar'}
						</Button>
						<Button type="submit" className="min-w-28" loading={submitting} loadingLabel="Salvando...">
							Salvar
						</Button>
					</footer>
				</form>
			</section>
		</div>
	);
};
