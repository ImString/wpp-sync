import { useEffect, useMemo, useState } from 'react';
import { MdAdd, MdClose, MdEdit } from 'react-icons/md';

import { Button } from '@/components/buttons';

import { stageColorPresets } from './stageColors';
import { StageIcon, stageIconSuggestions } from './stageIcons';
import type { RelationshipStage, RelationshipStageDraft } from './types';

interface StageFormModalProps {
	stage?: RelationshipStage;
	existingStages: RelationshipStage[];
	onClose: () => void;
	onSave: (draft: RelationshipStageDraft, stageId?: string) => void | Promise<void>;
}

const fieldClassName =
	'mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white dark:border-[#223138] dark:bg-[#131f26] dark:focus:bg-[#0e181e]';

export const StageFormModal: React.FC<StageFormModalProps> = props => {
	const [draft, setDraft] = useState<RelationshipStageDraft>({
		name: props.stage?.name || '',
		color: props.stage?.color || stageColorPresets[0],
		description: props.stage?.description || '',
		icon: props.stage?.icon || 'label'
	});
	const [submitted, setSubmitted] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const isEditing = Boolean(props.stage);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') props.onClose();
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [props.onClose]);

	const errors = useMemo(() => {
		const normalizedName = draft.name.trim().toLocaleLowerCase('pt-BR');
		const duplicateName = props.existingStages.some(
			stage => stage.id !== props.stage?.id && stage.name.trim().toLocaleLowerCase('pt-BR') === normalizedName
		);

		return {
			name: !normalizedName
				? 'Informe o nome da etapa.'
				: duplicateName
					? 'Já existe uma etapa com esse nome.'
					: '',
			color: /^#[0-9a-f]{6}$/i.test(draft.color) ? '' : 'Use uma cor hexadecimal válida.'
		};
	}, [draft.color, draft.name, props.existingStages, props.stage?.id]);

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setSubmitted(true);

		if (Object.values(errors).some(Boolean)) return;

		setSubmitting(true);
		setErrorMessage('');

		try {
			await props.onSave(
				{
					name: draft.name.trim(),
					color: draft.color.toLowerCase(),
					description: draft.description.trim(),
					icon: draft.icon
				},
				props.stage?.id
			);
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : 'Não foi possível salvar a etapa.');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-[2px] mobile:items-center mobile:p-5"
			role="presentation"
			onMouseDown={event => {
				if (event.target === event.currentTarget) props.onClose();
			}}>
			<section
				role="dialog"
				aria-modal="true"
				aria-labelledby="stage-form-title"
				className="contacts-form-modal max-h-[94dvh] w-full overflow-y-auto rounded-t-3xl border border-slate-200 bg-white shadow-2xl dark:border-[#223138] dark:bg-[#0e181e] mobile:max-w-130 mobile:rounded-[22px] scrollbar-thin">
				<header className="flex items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-[#223138] mobile:px-5">
					<div className="flex items-center gap-3">
						<span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-[#0f3826] dark:text-brand-400">
							{isEditing ? <MdEdit aria-hidden="true" /> : <MdAdd aria-hidden="true" />}
						</span>
						<div>
							<h2 id="stage-form-title" className="text-base font-bold">
								{isEditing ? 'Editar etapa' : 'Nova etapa'}
							</h2>
							<p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
								Defina como essa fase aparecerá nos contatos.
							</p>
						</div>
					</div>
					<Button
						theme="ghost"
						type="button"
						className="icon-button"
						aria-label="Fechar"
						onClick={props.onClose}>
						<MdClose aria-hidden="true" />
					</Button>
				</header>

				<form onSubmit={handleSubmit} noValidate>
					<div className="grid gap-4 p-4 mobile:p-5">
						{errorMessage && (
							<p className="rounded-xl bg-red-50 px-3 py-2.5 text-[10px] text-red-700 dark:bg-red-500/10 dark:text-red-300">
								{errorMessage}
							</p>
						)}
						<label className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
							Nome da etapa <span className="text-red-500">*</span>
							<input
								autoFocus
								value={draft.name}
								onChange={event => setDraft(current => ({ ...current, name: event.target.value }))}
								placeholder="Ex.: Em negociação"
								aria-invalid={submitted && Boolean(errors.name)}
								className={fieldClassName}
							/>
							{submitted && errors.name && (
								<span className="mt-1 block text-[9px] text-red-500">{errors.name}</span>
							)}
						</label>

						<div>
							<div className="flex items-end justify-between gap-3">
								<div>
									<span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
										Ícone da etapa
									</span>
									<p className="mt-0.5 text-[9px] text-slate-400">
										Escolha uma sugestão para identificar esta fase.
									</p>
								</div>
								<span
									className="grid size-9 shrink-0 place-items-center rounded-xl"
									style={{ color: draft.color, backgroundColor: `${draft.color}1f` }}>
									<StageIcon name={draft.icon} className="size-4.5" />
								</span>
							</div>
							<div
								className="mt-2.5 grid grid-cols-7 gap-2 mobile:grid-cols-9"
								role="listbox"
								aria-label="Ícones sugeridos para a etapa">
								{stageIconSuggestions.map(suggestion => {
									const selected = draft.icon === suggestion.name;

									return (
										<button
											key={suggestion.name}
											type="button"
											role="option"
											aria-label={suggestion.label}
											aria-selected={selected}
											title={suggestion.label}
											className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 outline-none transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-brand-500/40 dark:border-[#223138] dark:bg-[#131f26] dark:hover:border-[#344851] dark:hover:bg-[#17262e] dark:hover:text-slate-200"
											style={
												selected
													? {
															color: draft.color,
															borderColor: draft.color,
															backgroundColor: `${draft.color}1f`,
															boxShadow: `0 0 0 2px ${draft.color}22`
														}
													: undefined
											}
											onClick={() =>
												setDraft(current => ({ ...current, icon: suggestion.name }))
											}>
											<suggestion.icon className="size-4.5" aria-hidden="true" />
										</button>
									);
								})}
							</div>
						</div>

						<div>
							<span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
								Cor da etapa
							</span>
							<div className="mt-2 flex flex-wrap gap-2">
								{stageColorPresets.map(color => (
									<button
										key={color}
										type="button"
										aria-label={`Usar cor ${color}`}
										aria-pressed={draft.color.toLowerCase() === color}
										className="size-8 rounded-full border-2 border-white shadow-sm outline-1 outline-slate-200 transition hover:scale-110 dark:border-[#0e181e] dark:outline-[#344851]"
										style={{
											backgroundColor: color,
											boxShadow:
												draft.color.toLowerCase() === color ? `0 0 0 3px ${color}55` : undefined
										}}
										onClick={() => setDraft(current => ({ ...current, color }))}
									/>
								))}
							</div>
							<div className="mt-3 grid grid-cols-[48px_minmax(0,1fr)] gap-2">
								<label
									className="relative h-10 overflow-hidden rounded-xl border border-slate-200 dark:border-[#223138]"
									aria-label="Selecionar qualquer cor">
									<input
										type="color"
										value={/^#[0-9a-f]{6}$/i.test(draft.color) ? draft.color : '#25d366'}
										onChange={event =>
											setDraft(current => ({ ...current, color: event.target.value }))
										}
										className="absolute -inset-2 size-16 cursor-pointer border-0 p-0"
									/>
								</label>
								<label className="sr-only" htmlFor="stage-color-hex">
									Cor hexadecimal
								</label>
								<input
									id="stage-color-hex"
									value={draft.color}
									onChange={event => setDraft(current => ({ ...current, color: event.target.value }))}
									placeholder="#25d366"
									aria-invalid={submitted && Boolean(errors.color)}
									className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 font-mono text-xs uppercase outline-none focus:border-brand-500 dark:border-[#223138] dark:bg-[#131f26]"
								/>
							</div>
							{submitted && errors.color && (
								<span className="mt-1 block text-[9px] text-red-500">{errors.color}</span>
							)}
						</div>

						<label className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
							Descrição
							<textarea
								value={draft.description}
								onChange={event =>
									setDraft(current => ({ ...current, description: event.target.value }))
								}
								rows={3}
								maxLength={180}
								placeholder="Explique quando um contato deve entrar nessa etapa."
								className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 outline-none focus:border-brand-500 dark:border-[#223138] dark:bg-[#131f26]"
							/>
							<span className="mt-1 block text-right font-normal text-slate-400">
								{draft.description.length}/180
							</span>
						</label>
					</div>

					<footer className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3.5 dark:border-[#223138] mobile:px-5">
						<Button
							theme="secondary"
							type="button"
							className="min-w-24"
							disabled={submitting}
							onClick={props.onClose}>
							Cancelar
						</Button>
						<Button type="submit" className="min-w-28" loading={submitting} loadingLabel="Salvando...">
							{isEditing ? 'Salvar etapa' : 'Criar etapa'}
						</Button>
					</footer>
				</form>
			</section>
		</div>
	);
};
