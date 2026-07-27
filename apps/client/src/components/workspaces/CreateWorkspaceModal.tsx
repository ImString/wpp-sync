import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { MdClose, MdOutlineCameraAlt } from 'react-icons/md';

import type { CreateWorkspaceData } from '@/stores';

import {
	workspaceEyebrowClassName,
	workspaceFieldClassName,
	workspaceIconButtonClassName,
	workspacePrimaryButtonClassName,
	workspaceSecondaryButtonClassName
} from './styles';

interface CreateWorkspaceModalProps {
	isOpen: boolean;
	onClose: () => void;
	onCreate: (data: CreateWorkspaceData) => Promise<void>;
}

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const SUPPORTED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = props => {
	const nameInputRef = useRef<HTMLInputElement>(null);
	const avatarInputRef = useRef<HTMLInputElement>(null);
	const [name, setName] = useState('');
	const [avatar, setAvatar] = useState<File | null>(null);
	const [nameError, setNameError] = useState('');
	const [avatarError, setAvatarError] = useState('');
	const [submitError, setSubmitError] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (!props.isOpen) return;

		const focusTimeout = window.setTimeout(() => nameInputRef.current?.focus(), 0);
		return () => window.clearTimeout(focusTimeout);
	}, [props.isOpen]);

	const resetAndClose = () => {
		setName('');
		setAvatar(null);
		setNameError('');
		setAvatarError('');
		setSubmitError('');
		props.onClose();
	};

	const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		event.target.value = '';

		if (!file) return;

		if (!SUPPORTED_AVATAR_TYPES.includes(file.type)) {
			setAvatarError('Use uma imagem JPG, PNG ou WEBP.');
			return;
		}

		if (file.size > MAX_AVATAR_SIZE) {
			setAvatarError('A imagem deve ter no máximo 5 MB.');
			return;
		}

		setAvatar(file);
		setAvatarError('');
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const normalizedName = name.trim();
		setSubmitError('');

		if (!normalizedName) {
			setNameError('Informe o nome da área.');
			return;
		}

		setIsSubmitting(true);

		try {
			await props.onCreate({ name: normalizedName, avatar: avatar || undefined });
			resetAndClose();
		} catch (error) {
			setSubmitError(error instanceof Error ? error.message : 'Não foi possível criar a área de trabalho.');
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!props.isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-60 grid place-items-center bg-black/60 p-5 backdrop-blur-[5px] max-[420px]:p-2.5"
			onMouseDown={event => event.target === event.currentTarget && !isSubmitting && resetAndClose()}>
			<section
				className="w-[min(480px,100%)] animate-[workspace-modal-in_170ms_ease-out] overflow-hidden rounded-[20px] border border-(--workspace-border) bg-(--workspace-surface) shadow-[0_30px_90px_rgba(0,0,0,.36)]"
				role="dialog"
				aria-modal="true"
				aria-labelledby="create-workspace-title">
				<header className="flex items-start justify-between gap-3.5 border-b border-(--workspace-border) px-5.5 pt-5.5 pb-4 max-[420px]:px-4">
					<div>
						<span className={workspaceEyebrowClassName}>Nova organização</span>
						<h2 id="create-workspace-title" className="m-0 text-[19px] font-bold tracking-[-.04em]">
							Criar área de trabalho
						</h2>
					</div>
					<button
						className={workspaceIconButtonClassName}
						type="button"
						aria-label="Fechar"
						disabled={isSubmitting}
						onClick={resetAndClose}>
						<MdClose aria-hidden="true" />
					</button>
				</header>

				<form className="grid gap-4 px-5.5 pt-5 pb-5.5 max-[420px]:px-4" onSubmit={handleSubmit}>
					<label className="grid gap-1.75 text-[11px] font-semibold text-(--workspace-text)">
						<span>Nome da área</span>
						<input
							className={workspaceFieldClassName}
							ref={nameInputRef}
							type="text"
							placeholder="Ex.: Minha empresa"
							required
							maxLength={128}
							value={name}
							aria-describedby={nameError ? 'workspace-name-error' : undefined}
							onChange={event => {
								setName(event.target.value);
								setNameError('');
							}}
						/>
						{nameError && (
							<small
								className="text-[10px] font-medium text-red-600 dark:text-red-400"
								id="workspace-name-error">
								{nameError}
							</small>
						)}
					</label>

					<div className="grid gap-1.75 text-[11px] font-semibold text-(--workspace-text)">
						<span>Imagem da área (opcional)</span>
						<div className="flex items-center gap-2.5 rounded-[10px] border border-(--workspace-border) bg-(--workspace-surface-muted) p-2.5">
							<span className="grid size-10 shrink-0 place-items-center rounded-[9px] bg-brand-50 text-brand-600 dark:bg-[rgba(37,211,102,.11)]">
								<MdOutlineCameraAlt className="size-5" aria-hidden="true" />
							</span>
							<span className="min-w-0 flex-1">
								<strong className="block truncate text-[10px]">
									{avatar?.name || 'Nenhuma imagem selecionada'}
								</strong>
								<small className="text-[9px] font-normal text-(--workspace-muted)">
									JPG, PNG ou WEBP · máximo de 5 MB
								</small>
							</span>
							<button
								className={workspaceSecondaryButtonClassName}
								type="button"
								disabled={isSubmitting}
								onClick={() => avatarInputRef.current?.click()}>
								Escolher
							</button>
							<input
								ref={avatarInputRef}
								className="sr-only"
								type="file"
								accept="image/jpeg,image/png,image/webp"
								onChange={handleAvatarChange}
							/>
						</div>
						{avatarError && (
							<small className="text-[10px] font-medium text-red-600 dark:text-red-400">
								{avatarError}
							</small>
						)}
					</div>

					{submitError && (
						<p
							className="rounded-[10px] bg-red-50 px-3 py-2.5 text-[10px] font-medium text-red-700 dark:bg-red-950/30 dark:text-red-300"
							role="alert">
							{submitError}
						</p>
					)}

					<footer className="mt-1 flex justify-end gap-2.25">
						<button
							className={workspaceSecondaryButtonClassName}
							type="button"
							disabled={isSubmitting}
							onClick={resetAndClose}>
							Cancelar
						</button>
						<button
							className={workspacePrimaryButtonClassName}
							type="submit"
							disabled={isSubmitting}>
							{isSubmitting ? 'Criando...' : 'Criar área'}
						</button>
					</footer>
				</form>
			</section>
		</div>
	);
};
