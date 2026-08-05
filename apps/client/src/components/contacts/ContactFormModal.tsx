import { useEffect, useMemo, useState } from 'react';
import { MdAdd, MdClose, MdEdit } from 'react-icons/md';

import { isPossiblePhone } from '@/utils';

import { Button } from '@/components/buttons';
import { PhoneInput } from '@/components/inputs';

import type { Contact, ContactDraft, RelationshipStage } from './types';

interface ContactFormModalProps {
	contact?: Contact;
	stages: RelationshipStage[];
	onClose: () => void;
	onSave: (draft: ContactDraft, contactId?: string) => void | Promise<void>;
}

const createDraft = (contact?: Contact, defaultStageId = ''): ContactDraft => ({
	name: contact?.name || '',
	phone: contact?.phone || '',
	email: contact?.email || '',
	stageId: contact ? contact.stageId || '' : defaultStageId,
	tags: contact?.tags.join(', ') || ''
});

const fieldClassName =
	'mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white dark:border-[#223138] dark:bg-[#131f26] dark:focus:bg-[#0e181e]';

export const ContactFormModal: React.FC<ContactFormModalProps> = props => {
	const [draft, setDraft] = useState<ContactDraft>(() => createDraft(props.contact, props.stages[0]?.id));
	const [submitted, setSubmitted] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const isEditing = Boolean(props.contact);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') props.onClose();
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [props.onClose]);

	const errors = useMemo(
		() => ({
			name: draft.name.trim() ? '' : 'Informe o nome do contato.',
			phone: isPossiblePhone(draft.phone) ? '' : 'Informe um telefone válido.',
			email:
				!draft.email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email) ? '' : 'Informe um e-mail válido.'
		}),
		[draft.email, draft.name, draft.phone]
	);

	const updateField = <Key extends keyof ContactDraft>(field: Key, value: ContactDraft[Key]) => {
		setDraft(current => ({ ...current, [field]: value }));
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setSubmitted(true);

		if (Object.values(errors).some(Boolean)) return;

		setSubmitting(true);
		setErrorMessage('');

		try {
			await props.onSave(
				{
					...draft,
					name: draft.name.trim(),
					phone: draft.phone.trim(),
					email: draft.email.trim(),
					tags: draft.tags.trim()
				},
				props.contact?.id
			);
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : 'Não foi possível salvar o contato.');
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
				aria-labelledby="contact-form-title"
				className="contacts-form-modal max-h-[94dvh] w-full overflow-y-auto rounded-t-3xl border border-slate-200 bg-white shadow-2xl dark:border-[#223138] dark:bg-[#0e181e] mobile:max-w-155 mobile:rounded-[22px] scrollbar-thin">
				<header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur dark:border-[#223138] dark:bg-[#0e181e]/95 mobile:px-5">
					<div className="flex items-center gap-3">
						<span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-[#0f3826] dark:text-brand-400">
							{isEditing ? <MdEdit aria-hidden="true" /> : <MdAdd aria-hidden="true" />}
						</span>
						<div>
							<h2 id="contact-form-title" className="text-base font-bold">
								{isEditing ? 'Editar contato' : 'Novo contato'}
							</h2>
							<p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
								{isEditing
									? 'Atualize as informações desta pessoa.'
									: 'Adicione uma pessoa à sua base de relacionamento.'}
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
					<div className="grid gap-4 p-4 mobile:grid-cols-2 mobile:p-5">
						{errorMessage && (
							<p className="rounded-xl bg-red-50 px-3 py-2.5 text-[10px] text-red-700 dark:bg-red-500/10 dark:text-red-300 mobile:col-span-2">
								{errorMessage}
							</p>
						)}
						<label className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 mobile:col-span-2">
							Nome completo <span className="text-red-500">*</span>
							<input
								autoFocus
								value={draft.name}
								onChange={event => updateField('name', event.target.value)}
								placeholder="Ex.: Fernanda Almeida"
								aria-invalid={submitted && Boolean(errors.name)}
								className={fieldClassName}
							/>
							{submitted && errors.name && (
								<span className="mt-1 block text-[9px] text-red-500">{errors.name}</span>
							)}
						</label>

						<label
							htmlFor="contact-phone"
							className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
							Telefone / WhatsApp <span className="text-red-500">*</span>
							<PhoneInput
								id="contact-phone"
								name="phone"
								value={draft.phone}
								onChange={value => updateField('phone', value)}
								placeholder="+55 (31) 99999-9999"
								required
								invalid={submitted && Boolean(errors.phone)}
							/>
							{submitted && errors.phone && (
								<span className="mt-1 block text-[9px] text-red-500">{errors.phone}</span>
							)}
						</label>

						<label className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
							E-mail
							<input
								type="email"
								value={draft.email}
								onChange={event => updateField('email', event.target.value)}
								placeholder="nome@empresa.com"
								aria-invalid={submitted && Boolean(errors.email)}
								className={fieldClassName}
							/>
							{submitted && errors.email && (
								<span className="mt-1 block text-[9px] text-red-500">{errors.email}</span>
							)}
						</label>

						<label className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 mobile:col-span-2">
							Etapa do relacionamento
							<select
								value={draft.stageId}
								onChange={event => updateField('stageId', event.target.value)}
								className={fieldClassName}>
								<option value="">Sem etapa</option>
								{props.stages.map(stage => (
									<option key={stage.id} value={stage.id}>
										{stage.name}
									</option>
								))}
							</select>
						</label>

						<label className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 mobile:col-span-2">
							Tags
							<input
								value={draft.tags}
								onChange={event => updateField('tags', event.target.value)}
								placeholder="Cliente, Premium, Instagram"
								className={fieldClassName}
							/>
							<span className="mt-1.5 block font-normal text-slate-400">
								Separe as tags por vírgulas.
							</span>
						</label>
					</div>

					<footer className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-slate-200 bg-white/95 px-4 py-3.5 backdrop-blur dark:border-[#223138] dark:bg-[#0e181e]/95 mobile:px-5">
						<Button
							theme="secondary"
							type="button"
							className="min-w-24"
							disabled={submitting}
							onClick={props.onClose}>
							Cancelar
						</Button>
						<Button type="submit" className="min-w-32" loading={submitting} loadingLabel="Salvando...">
							{isEditing ? 'Salvar alterações' : 'Adicionar contato'}
						</Button>
					</footer>
				</form>
			</section>
		</div>
	);
};
