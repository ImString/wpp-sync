import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { MdCheck, MdInfoOutline, MdOutlineCameraAlt, MdOutlineWorkspaces } from 'react-icons/md';

import { Button } from '@/components/buttons';
import { Image } from '@/components/shared/Image';
import type { Workspace } from '@/stores';

import type { SettingsFeedback } from './types';

interface WorkspaceSettingsProps {
	workspace?: Workspace;
	onFeedback: (feedback: SettingsFeedback) => void;
}

const MAX_ICON_SIZE = 5 * 1024 * 1024;
const SUPPORTED_ICON_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const WorkspaceSettings: React.FC<WorkspaceSettingsProps> = ({ workspace, onFeedback }) => {
	const iconInputRef = useRef<HTMLInputElement>(null);
	const [savedName, setSavedName] = useState(workspace?.name || 'Minha área de trabalho');
	const [name, setName] = useState(savedName);
	const [icon, setIcon] = useState<File | null>(null);
	const [savedIconPreview, setSavedIconPreview] = useState<string | null>(null);
	const [iconPreview, setIconPreview] = useState<string | null>(null);
	const [error, setError] = useState('');

	useEffect(() => {
		const workspaceName = workspace?.name || 'Minha área de trabalho';
		setSavedName(workspaceName);
		setName(workspaceName);
		setIcon(null);
		setSavedIconPreview(null);
		setIconPreview(null);
		setError('');
	}, [workspace?.uid, workspace?.name]);

	const isDirty = Boolean(icon || name.trim() !== savedName);

	const handleIconChange = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		event.target.value = '';
		if (!file) return;

		if (!SUPPORTED_ICON_TYPES.includes(file.type)) {
			setError('Use uma imagem JPG, PNG ou WEBP.');
			return;
		}

		if (file.size > MAX_ICON_SIZE) {
			setError('A imagem deve ter no máximo 5 MB.');
			return;
		}

		const reader = new FileReader();
		reader.onload = () => setIconPreview(typeof reader.result === 'string' ? reader.result : null);
		reader.readAsDataURL(file);
		setIcon(file);
		setError('');
	};

	const resetForm = () => {
		setName(savedName);
		setIcon(null);
		setIconPreview(null);
		setError('');
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const normalizedName = name.trim();

		if (normalizedName.length < 2) {
			setError('O nome deve ter pelo menos 2 caracteres.');
			return;
		}

		if (normalizedName.length > 64) {
			setError('Use no máximo 64 caracteres.');
			return;
		}

		setSavedName(normalizedName);
		setName(normalizedName);
		if (iconPreview) setSavedIconPreview(iconPreview);
		setIcon(null);
		setIconPreview(null);
		setError('');
		onFeedback({
			type: 'success',
			message: 'Alterações da área de trabalho aplicadas nesta prévia.'
		});
	};

	const displayedIcon = iconPreview || savedIconPreview || workspace?.avatarUrl || undefined;

	return (
		<div className="grid items-start gap-5 wide:grid-cols-[minmax(0,1fr)_270px]">
			<section className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-panel dark:border-[#223138] dark:bg-[#0e181e]">
				<header className="border-b border-slate-200 px-5 py-4.5 dark:border-[#223138] mobile:px-6">
					<h2 className="m-0 text-sm font-bold text-slate-900 dark:text-white">Identidade da área</h2>
					<p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
						Personalize como esta área de trabalho aparece para toda a equipe.
					</p>
				</header>

				<form onSubmit={handleSubmit}>
					<div className="px-5 py-5 mobile:px-6 mobile:py-6">
						<div className="flex flex-col gap-4 border-b border-slate-200 pb-6 dark:border-[#223138] mobile:flex-row mobile:items-center">
							<div className="relative size-22 shrink-0">
								<Image
									className="size-22 rounded-[22px] border-4 border-white object-cover shadow-[0_8px_24px_rgba(15,23,42,.14)] dark:border-[#17262e]"
									src={displayedIcon}
									seed={name || workspace?.name}
									collection="initials"
									size={256}
									scale={50}
									backgroundType="gradientLinear"
								/>
								<span className="absolute -right-1 bottom-0 grid size-8 place-items-center rounded-xl border-2 border-white bg-brand-600 text-white dark:border-[#0e181e]">
									<MdOutlineCameraAlt className="size-4" aria-hidden="true" />
								</span>
							</div>
							<div className="min-w-0 flex-1">
								<strong className="block text-xs text-slate-900 dark:text-white">
									Ícone da área de trabalho
								</strong>
								<p className="mt-1 max-w-lg text-[10px] leading-4 text-slate-500 dark:text-slate-400">
									Escolha uma imagem quadrada para facilitar a identificação no seletor de áreas.
								</p>
								<div className="mt-3 flex flex-wrap gap-2">
									<Button
										theme="secondary"
										type="button"
										className="min-h-9 px-3 text-[10px]"
										onClick={() => iconInputRef.current?.click()}>
										<MdOutlineCameraAlt aria-hidden="true" />
										{icon ? 'Escolher outra' : 'Trocar ícone'}
									</Button>
									{icon && (
										<Button
											theme="ghost"
											type="button"
											className="min-h-9 px-3 text-[10px]"
											onClick={() => {
												setIcon(null);
												setIconPreview(null);
											}}>
											Remover seleção
										</Button>
									)}
									<input
										ref={iconInputRef}
										className="sr-only"
										type="file"
										accept="image/jpeg,image/png,image/webp"
										onChange={handleIconChange}
									/>
								</div>
							</div>
						</div>

						<label className="mt-6 grid gap-1.5 text-[10px] font-semibold text-slate-700 dark:text-slate-200">
							<span>Nome da área de trabalho</span>
							<span className="relative flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 transition focus-within:border-brand-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-500/10 dark:border-[#2a3a42] dark:bg-[#131f26] dark:focus-within:bg-[#0e181e]">
								<MdOutlineWorkspaces className="mx-3 size-4.5 shrink-0" aria-hidden="true" />
								<input
									className="h-full min-w-0 flex-1 border-0 bg-transparent pr-3 text-xs font-normal text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
									type="text"
									value={name}
									maxLength={64}
									onChange={event => {
										setName(event.target.value);
										setError('');
									}}
								/>
							</span>
							<span className="min-h-3 text-[9px] font-medium text-red-600 dark:text-red-400">
								{error}
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
						<Button theme="primary" type="submit" className="min-h-10 text-[11px]" disabled={!isDirty}>
							<MdCheck aria-hidden="true" />
							Salvar alterações
						</Button>
					</footer>
				</form>
			</section>

			<aside className="grid gap-4">
				<section className="overflow-hidden rounded-[20px] border border-emerald-900/40 bg-[radial-gradient(circle_at_top_right,rgba(37,211,102,.17),transparent_46%),linear-gradient(145deg,#073b32,#04251f)] p-5 text-emerald-50 shadow-panel">
					<span className="text-[9px] font-extrabold uppercase tracking-[.12em] text-brand-400">
						Prévia da área
					</span>
					<div className="mt-5 flex items-center gap-3">
						<Image
							className="size-12 shrink-0 rounded-[13px] border-2 border-white/15 object-cover"
							src={displayedIcon}
							seed={name || workspace?.name}
							collection="initials"
							size={128}
							scale={50}
							backgroundType="gradientLinear"
						/>
						<div className="min-w-0">
							<strong className="block truncate text-sm">{name.trim() || 'Nome da área'}</strong>
							<span className="block truncate text-[10px] text-emerald-100/60">
								{workspace?.slug || 'sua-area-de-trabalho'}
							</span>
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
								Somente apresentação
							</strong>
							<p className="mt-1 text-[9px] leading-4 text-slate-500 dark:text-slate-400">
								Nesta etapa, as mudanças ficam apenas na interface e não são enviadas ao servidor.
							</p>
						</div>
					</div>
				</section>
			</aside>
		</div>
	);
};
