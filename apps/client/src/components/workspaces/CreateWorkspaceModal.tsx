import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { MdClose } from 'react-icons/md';

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
	existingSlugs: string[];
	onClose: () => void;
	onCreate: (data: CreateWorkspaceData) => void;
}

export const normalizeWorkspaceSlug = (value: string) => {
	return value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
};

export const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = props => {
	const nameInputRef = useRef<HTMLInputElement>(null);
	const [name, setName] = useState('');
	const [slug, setSlug] = useState('');
	const [segment, setSegment] = useState('Atendimento e suporte');
	const [slugEdited, setSlugEdited] = useState(false);
	const [nameError, setNameError] = useState('');
	const [slugError, setSlugError] = useState('');

	useEffect(() => {
		if (!props.isOpen) return;

		const focusTimeout = window.setTimeout(() => nameInputRef.current?.focus(), 0);
		return () => window.clearTimeout(focusTimeout);
	}, [props.isOpen]);

	const resetAndClose = () => {
		setName('');
		setSlug('');
		setSegment('Atendimento e suporte');
		setSlugEdited(false);
		setNameError('');
		setSlugError('');
		props.onClose();
	};

	const handleNameChange = (value: string) => {
		setName(value);
		setNameError('');
		if (!slugEdited) setSlug(normalizeWorkspaceSlug(value));
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const normalizedName = name.trim();
		const normalizedSlug = normalizeWorkspaceSlug(slug);

		if (!normalizedName) {
			setNameError('Informe o nome da área.');
			return;
		}

		if (!normalizedSlug) {
			setSlugError('Informe um identificador válido.');
			return;
		}

		if (props.existingSlugs.includes(normalizedSlug)) {
			setSlugError('Este identificador já está em uso.');
			return;
		}

		props.onCreate({ name: normalizedName, slug: normalizedSlug, segment });
		resetAndClose();
	};

	if (!props.isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-60 grid place-items-center bg-black/60 p-5 backdrop-blur-[5px] max-[420px]:p-2.5"
			onMouseDown={event => event.target === event.currentTarget && resetAndClose()}>
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
							maxLength={42}
							value={name}
							aria-describedby={nameError ? 'workspace-name-error' : undefined}
							onChange={event => handleNameChange(event.target.value)}
						/>
						{nameError && (
							<small
								className="text-[10px] font-medium text-red-600 dark:text-red-400"
								id="workspace-name-error">
								{nameError}
							</small>
						)}
					</label>

					<label className="grid gap-1.75 text-[11px] font-semibold text-(--workspace-text)">
						<span>Segmento</span>
						<select
							className={workspaceFieldClassName}
							value={segment}
							onChange={event => setSegment(event.target.value)}>
							<option>Atendimento e suporte</option>
							<option>Vendas</option>
							<option>Marketing</option>
							<option>Agência</option>
							<option>Outro</option>
						</select>
					</label>

					<footer className="mt-1 flex justify-end gap-2.25">
						<button className={workspaceSecondaryButtonClassName} type="button" onClick={resetAndClose}>
							Cancelar
						</button>
						<button className={workspacePrimaryButtonClassName} type="submit">
							Criar área
						</button>
					</footer>
				</form>
			</section>
		</div>
	);
};
