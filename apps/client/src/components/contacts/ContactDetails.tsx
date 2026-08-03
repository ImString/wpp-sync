import { useEffect, useState } from 'react';
import {
	MdArchive,
	MdArrowBack,
	MdBusiness,
	MdCall,
	MdChatBubbleOutline,
	MdCheck,
	MdContentCopy,
	MdEdit,
	MdEmail,
	MdLocationOn,
	MdOutlineAccessTime,
	MdOutlineAutoAwesome,
	MdOutlineHistory,
	MdOutlineNotes,
	MdWhatsapp
} from 'react-icons/md';
import { twMerge } from 'tailwind-merge';

import { Button } from '@/components/buttons';

import { ContactAvatar } from './Avatar';
import { StatusBadge } from './StatusBadge';
import type { Contact, RelationshipStage } from './types';

interface ContactDetailsProps {
	contact?: Contact;
	stage?: RelationshipStage;
	isOpen: boolean;
	onClose: () => void;
	onEdit: (contact: Contact) => void;
	onOpenConversation: (contact: Contact) => void;
	onSaveNotes: (contactId: string, notes: string) => void;
	onArchive?: (contactId: string) => void;
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

export const ContactDetails: React.FC<ContactDetailsProps> = props => {
	const [notes, setNotes] = useState(props.contact?.notes || '');
	const [notesSaved, setNotesSaved] = useState(false);
	const [phoneCopied, setPhoneCopied] = useState(false);

	useEffect(() => {
		setNotes(props.contact?.notes || '');
		setNotesSaved(false);
	}, [props.contact?.id, props.contact?.notes]);

	if (!props.contact) {
		return (
			<aside className="hidden min-h-0 place-items-center rounded-2xl border border-slate-200 bg-white p-8 text-center mobile:grid dark:border-[#223138] dark:bg-[#0e181e]">
				<div className="max-w-52">
					<span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-[#0f3826] dark:text-brand-400">
						<MdOutlineAutoAwesome className="size-6" aria-hidden="true" />
					</span>
					<h3 className="mt-3 text-sm font-semibold">Selecione um contato</h3>
					<p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
						Os detalhes aparecerão aqui.
					</p>
				</div>
			</aside>
		);
	}

	const contact = props.contact;
	const normalizedPhone = contact.phone.replace(/\D/g, '');
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

	const handleSaveNotes = () => {
		props.onSaveNotes(contact.id, notes.trim());
		setNotesSaved(true);
		window.setTimeout(() => setNotesSaved(false), 1600);
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
				<p className="mt-1 truncate text-[11px] text-slate-500 dark:text-slate-400">
					{contact.company || contact.phone}
				</p>
				<div className="mt-2.5 flex justify-center">
					<StatusBadge stage={props.stage} />
				</div>

				<div className="mx-auto mt-5 grid max-w-64 grid-cols-3 gap-2">
					<Button
						theme="ghost"
						type="button"
						className="flex min-h-14 flex-col gap-1 rounded-xl bg-brand-50 px-2 text-[9px] text-brand-700 hover:bg-brand-100 dark:bg-[#0f3826] dark:text-brand-400 dark:hover:bg-[#124931]"
						onClick={() => props.onOpenConversation(contact)}>
						<MdChatBubbleOutline className="size-5" aria-hidden="true" />
						Conversar
					</Button>
					<a
						href={`https://wa.me/${normalizedPhone}`}
						target="_blank"
						rel="noreferrer"
						className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl bg-slate-100 px-2 text-[9px] font-semibold text-slate-600 transition hover:bg-slate-200 dark:bg-[#17262e] dark:text-slate-300 dark:hover:bg-[#1d3039]">
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
					<DetailRow icon={MdWhatsapp} label="Telefone" value={contact.phone} />
					<DetailRow icon={MdEmail} label="E-mail" value={contact.email || 'Não informado'} />
					{contact.company && <DetailRow icon={MdBusiness} label="Empresa" value={contact.company} />}
					<DetailRow icon={MdLocationOn} label="Localização" value={contact.city || 'Não informada'} />
				</dl>
			</section>

			<section className="border-b border-slate-200 p-4 dark:border-[#223138] mobile:p-5">
				<h3 className="text-xs font-semibold">Tags</h3>
				<div className="mt-3 flex flex-wrap gap-1.5">
					{contact.tags.map(tag => (
						<span
							key={tag}
							className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-semibold text-brand-700 dark:bg-[#0f3826] dark:text-brand-400">
							{tag}
						</span>
					))}
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
						className="h-8 min-h-8 rounded-lg px-3 text-[10px]"
						disabled={!notesChanged}
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
				<div className="relative mt-4 grid gap-4 pl-1 before:absolute before:bottom-2 before:left-1.75 before:top-2 before:w-px before:bg-slate-200 dark:before:bg-[#223138]">
					<div className="relative flex gap-3">
						<span className="z-1 mt-0.5 size-2 rounded-full bg-brand-500 ring-4 ring-white dark:ring-[#0e181e]" />
						<div>
							<p className="text-[10px] font-medium">Última interação no WhatsApp</p>
							<span className="mt-0.5 flex items-center gap-1 text-[9px] text-slate-400">
								<MdOutlineAccessTime aria-hidden="true" /> {contact.lastInteraction}
							</span>
						</div>
					</div>
					<div className="relative flex gap-3">
						<span className="z-1 mt-0.5 size-2 rounded-full bg-sky-400 ring-4 ring-white dark:ring-[#0e181e]" />
						<div>
							<p className="text-[10px] font-medium">Contato adicionado à base</p>
							<span className="mt-0.5 text-[9px] text-slate-400">
								{contact.firstContact} · {contact.origin}
							</span>
						</div>
					</div>
				</div>

				{props.onArchive && (
					<Button
						theme="ghost"
						type="button"
						className="mt-5 h-9 min-h-9 w-full rounded-xl text-[10px] text-slate-400 hover:text-amber-600"
						onClick={() => props.onArchive?.(contact.id)}>
						<MdArchive aria-hidden="true" />
						{contact.stageId === 'inactive' ? 'Reativar contato' : 'Arquivar contato'}
					</Button>
				)}
			</section>
		</aside>
	);
};
