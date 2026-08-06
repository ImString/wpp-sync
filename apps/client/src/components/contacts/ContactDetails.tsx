import { useEffect, useState } from 'react';
import {
	MdArrowBack,
	MdCall,
	MdCheck,
	MdContentCopy,
	MdDeleteOutline,
	MdEdit,
	MdEmail,
	MdOutlineAccessTime,
	MdOutlineHistory,
	MdOutlineNotes,
	MdWhatsapp
} from 'react-icons/md';
import { twMerge } from 'tailwind-merge';

import { formatNationalPhone } from '@/utils';

import { Button } from '@/components/buttons';

import { ContactAvatar } from './Avatar';
import { StatusBadge } from './StatusBadge';
import type { Contact, RelationshipStage } from './types';

interface ContactDetailsProps {
	contact: Contact;
	stage?: RelationshipStage;
	isOpen: boolean;
	onClose: () => void;
	onEdit: (contact: Contact) => void;
	onSaveNotes: (contactId: string, notes: string) => Promise<void>;
	onDelete: (contactId: string) => Promise<void>;
}

const DetailRow: React.FC<{
	icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
	label: string;
	value: string;
}> = ({ icon: Icon, label, value }) => (
	<div className="flex items-start gap-3">
		<span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-400 dark:bg-[#17262e] dark:text-slate-500">
			<Icon className="size-4" aria-hidden="true" />
		</span>
		<div className="min-w-0 flex-1">
			<dt className="text-[9px] font-semibold uppercase tracking-[.06em] text-slate-400">{label}</dt>
			<dd className="mt-0.5 truncate text-[11px] text-slate-700 dark:text-slate-200">{value}</dd>
		</div>
	</div>
);

const formatCreatedAt = (value?: string) => {
	if (!value) return 'Data não informada';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return 'Data não informada';
	return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(date);
};

export const ContactDetails: React.FC<ContactDetailsProps> = props => {
	const [notes, setNotes] = useState(props.contact.notes);
	const [notesSaved, setNotesSaved] = useState(false);
	const [phoneCopied, setPhoneCopied] = useState(false);
	const [savingNotes, setSavingNotes] = useState(false);
	const [deleteConfirmation, setDeleteConfirmation] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');

	useEffect(() => {
		setNotes(props.contact.notes);
		setNotesSaved(false);
		setDeleteConfirmation(false);
		setErrorMessage('');
	}, [props.contact.id, props.contact.notes]);

	const contact = props.contact;
	const normalizedPhone = contact.phone.replace(/\D/g, '');
	const formattedPhone = formatNationalPhone(contact.phone) || contact.phone;
	const notesChanged = notes !== contact.notes;

	const handleCopyPhone = async () => {
		try {
			await navigator.clipboard.writeText(contact.phone);
			setPhoneCopied(true);
			window.setTimeout(() => setPhoneCopied(false), 1600);
		} catch {
			setPhoneCopied(false);
		}
	};

	const handleSaveNotes = async () => {
		setSavingNotes(true);
		setErrorMessage('');
		try {
			await props.onSaveNotes(contact.id, notes.trim());
			setNotesSaved(true);
			window.setTimeout(() => setNotesSaved(false), 1600);
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : 'Não foi possível salvar a nota.');
		} finally {
			setSavingNotes(false);
		}
	};

	const handleDelete = async () => {
		setDeleting(true);
		setErrorMessage('');
		try {
			await props.onDelete(contact.id);
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : 'Não foi possível excluir o contato.');
			setDeleting(false);
		}
	};

	return (
		<aside
			aria-label={`Detalhes de ${contact.name}`}
			className={twMerge(
				'contacts-detail-panel min-h-0 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-panel scrollbar-thin dark:border-[#223138] dark:bg-[#0e181e]',
				props.isOpen && 'is-open'
			)}>
			<header className="sticky top-0 z-10 flex min-h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-3 backdrop-blur mobile:hidden dark:border-[#223138] dark:bg-[#0e181e]/95">
				<Button
					theme="ghost"
					type="button"
					className="icon-button"
					aria-label="Voltar para contatos"
					onClick={props.onClose}>
					<MdArrowBack aria-hidden="true" />
				</Button>
				<strong className="text-sm">Detalhes do contato</strong>
				<Button
					theme="ghost"
					type="button"
					className="icon-button"
					aria-label="Editar contato"
					onClick={() => props.onEdit(contact)}>
					<MdEdit aria-hidden="true" />
				</Button>
			</header>

			<div className="border-b border-slate-200 px-4 pb-5 pt-5 text-center dark:border-[#223138] mobile:px-5 mobile:pt-6">
				<div className="hidden items-center justify-end mobile:flex">
					<Button
						theme="ghost"
						type="button"
						className="size-9 min-h-9 rounded-lg p-0"
						aria-label="Editar contato"
						onClick={() => props.onEdit(contact)}>
						<MdEdit aria-hidden="true" />
					</Button>
				</div>
				<ContactAvatar
					contactId={contact.id}
					initials={contact.initials}
					className="mx-auto size-18 text-lg ring-4"
				/>
				<h2 className="mt-3 truncate text-lg font-bold tracking-[-.02em]">{contact.name}</h2>
				<p className="mt-1 truncate text-[11px] text-slate-500 dark:text-slate-400">{formattedPhone}</p>
				<div className="mt-2.5 flex justify-center">
					<StatusBadge stage={props.stage} />
				</div>

				<div className="mx-auto mt-5 grid max-w-52 grid-cols-2 gap-2">
					<a
						href={`https://wa.me/${normalizedPhone}`}
						target="_blank"
						rel="noreferrer"
						className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl bg-brand-50 px-2 text-[9px] font-semibold text-brand-700 transition hover:bg-brand-100 dark:bg-[#0f3826] dark:text-brand-400 dark:hover:bg-[#124931]">
						<MdWhatsapp className="size-5" aria-hidden="true" />
						WhatsApp
					</a>
					<a
						href={`tel:${normalizedPhone}`}
						className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl bg-slate-100 px-2 text-[9px] font-semibold text-slate-600 transition hover:bg-slate-200 dark:bg-[#17262e] dark:text-slate-300 dark:hover:bg-[#1d3039]">
						<MdCall className="size-5" aria-hidden="true" />
						Ligar
					</a>
				</div>
			</div>

			<section className="border-b border-slate-200 p-4 dark:border-[#223138] mobile:p-5">
				<div className="flex items-center justify-between">
					<h3 className="text-xs font-semibold">Informações</h3>
					<Button
						theme="ghost"
						type="button"
						className="h-7 min-h-7 rounded-lg px-2 text-[9px]"
						onClick={handleCopyPhone}>
						{phoneCopied ? <MdCheck aria-hidden="true" /> : <MdContentCopy aria-hidden="true" />}
						{phoneCopied ? 'Copiado' : 'Copiar telefone'}
					</Button>
				</div>
				<dl className="mt-4 grid gap-4">
					<DetailRow icon={MdWhatsapp} label="Telefone" value={formattedPhone} />
					<DetailRow icon={MdEmail} label="E-mail" value={contact.email || 'Não informado'} />
				</dl>
			</section>

			<section className="border-b border-slate-200 p-4 dark:border-[#223138] mobile:p-5">
				<h3 className="text-xs font-semibold">Tags</h3>
				<div className="mt-3 flex flex-wrap gap-1.5">
					{contact.tags.length ? (
						contact.tags.map(tag => (
							<span
								key={tag}
								className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-[#0f3826] dark:text-brand-400">
								{tag}
							</span>
						))
					) : (
						<span className="text-xs text-slate-400">Nenhuma tag adicionada.</span>
					)}
				</div>
			</section>

			<section className="border-b border-slate-200 p-4 dark:border-[#223138] mobile:p-5">
				<div className="flex items-center gap-2">
					<MdOutlineNotes className="size-4 text-slate-400" aria-hidden="true" />
					<h3 className="text-xs font-semibold">Notas internas</h3>
				</div>
				<textarea
					value={notes}
					onChange={event => setNotes(event.target.value)}
					rows={4}
					placeholder="Adicione informações úteis para a equipe..."
					className="mt-3 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] leading-5 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white dark:border-[#223138] dark:bg-[#131f26] dark:focus:bg-[#0e181e]"
				/>
				<div className="mt-2 flex justify-end">
					<Button
						type="button"
						className="h-8 min-h-8 rounded-lg px-3 text-xs"
						disabled={!notesChanged}
						loading={savingNotes}
						loadingLabel="Salvando..."
						onClick={handleSaveNotes}>
						{notesSaved && <MdCheck aria-hidden="true" />}
						{notesSaved ? 'Salvo' : 'Salvar nota'}
					</Button>
				</div>
			</section>

			<section className="p-4 mobile:p-5">
				<div className="flex items-center gap-2">
					<MdOutlineHistory className="size-4 text-slate-400" aria-hidden="true" />
					<h3 className="text-xs font-semibold">Histórico</h3>
				</div>
				<div className="mt-4 flex gap-3">
					<span className="mt-0.5 size-2 rounded-full bg-brand-500 ring-4 ring-white dark:ring-[#0e181e]" />
					<div>
						<p className="text-xs font-medium">Contato adicionado à base</p>
						<span className="mt-0.5 flex items-center gap-1 text-[9px] text-slate-400">
							<MdOutlineAccessTime aria-hidden="true" /> {formatCreatedAt(contact.createdAt)}
						</span>
					</div>
				</div>

				{errorMessage && (
					<p className="mt-4 rounded-xl bg-red-50 px-3 py-2.5 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-300">
						{errorMessage}
					</p>
				)}

				{deleteConfirmation ? (
					<div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-500/20 dark:bg-red-500/10">
						<p className="text-xs leading-4 text-red-700 dark:text-red-300">
							Excluir este contato? Esta ação remove o contato da base.
						</p>
						<div className="mt-3 flex justify-end gap-2">
							<Button
								theme="ghost"
								type="button"
								className="h-8 min-h-8 text-xs"
								disabled={deleting}
								onClick={() => setDeleteConfirmation(false)}>
								Cancelar
							</Button>
							<Button
								theme="danger"
								type="button"
								className="h-8 min-h-8 text-xs"
								loading={deleting}
								loadingLabel="Excluindo..."
								onClick={handleDelete}>
								Excluir
							</Button>
						</div>
					</div>
				) : (
					<Button
						theme="ghost"
						type="button"
						className="mt-5 h-9 min-h-9 w-full rounded-xl text-xs text-slate-400 hover:text-red-600"
						onClick={() => setDeleteConfirmation(true)}>
						<MdDeleteOutline aria-hidden="true" />
						Excluir contato
					</Button>
				)}
			</section>
		</aside>
	);
};
