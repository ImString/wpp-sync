import { useEffect, useMemo, useRef, useState } from 'react';
import { MdAdd, MdDownload, MdFilterList, MdGroups, MdStar, MdTune } from 'react-icons/md';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@/components/buttons';
import { Pagination, useClientPagination } from '@/components/pagination';

import { ContactDetails } from './ContactDetails';
import { ContactFormModal } from './ContactFormModal';
import { ContactList } from './ContactList';
import type { ContactsLayoutContext } from './Layout';
import { hexToRgba } from './stageColors';
import { StageIcon } from './stageIcons';
import { useContactsStore } from './store';
import type { Contact, ContactDraft, RelationshipStage, StageIconName } from './types';

const normalizeText = (value: string) =>
	value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim();

const escapeCsvValue = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

interface StatCardProps {
	label: string;
	value: number;
	stageId: string;
	activeStageId: string;
	color: string;
	all?: boolean;
	icon?: StageIconName;
	onClick: (stageId: string) => void;
}

const StatCard: React.FC<StatCardProps> = props => {
	const active = props.activeStageId === props.stageId;

	return (
		<button
			type="button"
			className={twMerge(
				'flex min-w-36.25 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-[#223138] dark:bg-[#0e181e] dark:hover:border-[#344851] dark:hover:bg-[#101c22]'
			)}
			style={
				active ? { borderColor: props.color, boxShadow: `0 0 0 2px ${hexToRgba(props.color, 0.1)}` } : undefined
			}
			onClick={() => props.onClick(props.stageId)}>
			<span
				className="grid size-9 shrink-0 place-items-center rounded-xl"
				style={{ color: props.color, backgroundColor: hexToRgba(props.color, 0.12) }}>
				{props.all ? (
					<MdGroups className="size-5" aria-hidden="true" />
				) : (
					<StageIcon name={props.icon} className="size-5" />
				)}
			</span>
			<span>
				<strong className="block text-lg leading-none">{props.value}</strong>
				<span className="mt-1 block max-w-28 truncate whitespace-nowrap text-[9px] font-semibold uppercase tracking-[.06em] text-slate-400">
					{props.label}
				</span>
			</span>
		</button>
	);
};

export const ContactsPage: React.FC = () => {
	const navigate = useNavigate();
	const { uid, contactId } = useParams<{ uid: string; contactId?: string }>();
	const { search, createRequest } = useOutletContext<ContactsLayoutContext>();
	const { contacts, stages, createContact, updateContact, toggleFavorite, updateNotes, moveContactToStage } =
		useContactsStore(
			useShallow(state => ({
				contacts: state.contacts,
				stages: state.stages,
				createContact: state.createContact,
				updateContact: state.updateContact,
				toggleFavorite: state.toggleFavorite,
				updateNotes: state.updateNotes,
				moveContactToStage: state.moveContactToStage
			}))
		);
	const [activeStageId, setActiveStageId] = useState('all');
	const [favoriteOnly, setFavoriteOnly] = useState(false);
	const [sort, setSort] = useState<'recent' | 'name'>('recent');
	const [formOpen, setFormOpen] = useState(false);
	const [editingContact, setEditingContact] = useState<Contact>();
	const [toast, setToast] = useState('');
	const previousCreateRequest = useRef(createRequest);
	const orderedStages = useMemo(() => [...stages].sort((first, second) => first.order - second.order), [stages]);
	const selectedContact = contacts.find(contact => contact.id === contactId);
	const selectedStage = orderedStages.find(stage => stage.id === selectedContact?.stageId);

	useEffect(() => {
		if (createRequest !== previousCreateRequest.current) {
			previousCreateRequest.current = createRequest;
			setEditingContact(undefined);
			setFormOpen(true);
		}
	}, [createRequest]);

	useEffect(() => {
		if (contactId && !selectedContact && uid) navigate(`/w/${uid}/contacts`, { replace: true });
	}, [contactId, navigate, selectedContact, uid]);

	useEffect(() => {
		if (!toast) return;

		const timeout = window.setTimeout(() => setToast(''), 2400);
		return () => window.clearTimeout(timeout);
	}, [toast]);

	useEffect(() => {
		if (activeStageId !== 'all' && !stages.some(stage => stage.id === activeStageId)) setActiveStageId('all');
	}, [activeStageId, stages]);

	const filteredContacts = useMemo(() => {
		const normalizedSearch = normalizeText(search);

		return contacts
			.filter(contact => {
				const stage = stages.find(item => item.id === contact.stageId);
				const searchableText = normalizeText(
					[
						contact.name,
						contact.phone,
						contact.email,
						contact.company,
						contact.city,
						stage?.name,
						...contact.tags
					]
						.filter(Boolean)
						.join(' ')
				);
				const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);
				const matchesStage = activeStageId === 'all' || contact.stageId === activeStageId;
				const matchesFavorite = !favoriteOnly || contact.favorite;

				return matchesSearch && matchesStage && matchesFavorite;
			})
			.sort((first, second) =>
				sort === 'name'
					? first.name.localeCompare(second.name, 'pt-BR')
					: second.lastInteractionOrder - first.lastInteractionOrder
			);
	}, [activeStageId, contacts, favoriteOnly, search, sort, stages]);
	const pagination = useClientPagination(filteredContacts);

	useEffect(() => {
		pagination.resetPage();
	}, [activeStageId, favoriteOnly, pagination.resetPage, search, sort]);

	const goToContacts = () => {
		if (uid) navigate(`/w/${uid}/contacts`);
	};

	const handleSelectContact = (nextContactId: string) => {
		if (uid) navigate(`/w/${uid}/contacts/${nextContactId}`);
	};

	const handleSaveContact = (draft: ContactDraft, currentContactId?: string) => {
		if (currentContactId) {
			updateContact(currentContactId, draft);
			setToast('Contato atualizado com sucesso.');
		} else {
			const contact = createContact(draft);
			setToast('Novo contato adicionado.');
			pagination.resetPage();
			if (uid) navigate(`/w/${uid}/contacts/${contact.id}`);
		}

		setFormOpen(false);
		setEditingContact(undefined);
	};

	const handleArchive = (currentContactId: string) => {
		const inactiveStage = stages.find(stage => stage.id === 'inactive');
		if (!inactiveStage) return;

		if (selectedContact?.stageId === inactiveStage.id) {
			const reactivationStage = orderedStages.find(stage => stage.id !== inactiveStage.id);
			if (!reactivationStage) return;
			moveContactToStage(currentContactId, reactivationStage.id);
			setToast('Contato reativado.');
			return;
		}

		moveContactToStage(currentContactId, inactiveStage.id);
		setToast('Contato arquivado.');
	};

	const handleExport = () => {
		const rows = [
			['Nome', 'Telefone', 'E-mail', 'Empresa', 'Cidade', 'Etapa', 'Tags'],
			...filteredContacts.map(contact => [
				contact.name,
				contact.phone,
				contact.email,
				contact.company || '',
				contact.city,
				stages.find(stage => stage.id === contact.stageId)?.name || '',
				contact.tags.join(' | ')
			])
		];
		const csv = rows.map(row => row.map(escapeCsvValue).join(';')).join('\n');
		const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
		const link = document.createElement('a');
		link.href = url;
		link.download = 'contatos-wppsync.csv';
		link.click();
		URL.revokeObjectURL(url);
		setToast(`${filteredContacts.length} contatos exportados.`);
	};

	return (
		<div
			className={twMerge(
				'contacts-page relative flex min-h-0 flex-col overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-[#0b151a] mobile:overflow-hidden scrollbar-thin',
				contactId && 'overflow-hidden'
			)}>
			<header className="shrink-0 px-3 pb-3 pt-4 mobile:px-5 mobile:pb-4 mobile:pt-5">
				<div className="flex items-end justify-between gap-3">
					<div>
						<p className="text-[9px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-500">
							Relacionamento
						</p>
						<h1 className="mt-1 text-xl font-bold tracking-[-.04em] mobile:text-2xl">Contatos</h1>
						<p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 mobile:text-[11px]">
							Gerencie pessoas, leads e clientes em um só lugar.
						</p>
					</div>
					<div className="flex shrink-0 items-center gap-2">
						<Button
							theme="secondary"
							type="button"
							aria-label="Gerenciar etapas"
							className="h-9 min-h-9 px-2.5 text-[10px] mobile:px-3"
							onClick={() => uid && navigate(`/w/${uid}/contacts/stages`)}>
							<MdTune aria-hidden="true" />
							<span className="hidden mobile:inline">Etapas</span>
						</Button>
						<Button
							theme="secondary"
							type="button"
							className="hidden h-9 min-h-9 px-3 text-[10px] mobile:inline-flex"
							onClick={handleExport}>
							<MdDownload aria-hidden="true" />
							Exportar
						</Button>
						<Button
							type="button"
							className="h-9 min-h-9 px-3 text-[10px] shadow-[0_8px_20px_rgba(37,211,102,.2)]"
							onClick={() => {
								setEditingContact(undefined);
								setFormOpen(true);
							}}>
							<MdAdd className="size-4" aria-hidden="true" />
							<span className="hidden mobile:inline">Novo contato</span>
							<span className="mobile:hidden">Novo</span>
						</Button>
					</div>
				</div>

				<div className="scrollbar-none -mx-3 mt-4 flex gap-2 overflow-x-auto px-3 py-1 mobile:mx-0 mobile:px-0">
					<StatCard
						label="Todos"
						value={contacts.length}
						stageId="all"
						activeStageId={activeStageId}
						color="#8b5cf6"
						all
						onClick={setActiveStageId}
					/>
					{orderedStages.map(stage => (
						<StatCard
							key={stage.id}
							label={stage.name}
							value={contacts.filter(contact => contact.stageId === stage.id).length}
							stageId={stage.id}
							activeStageId={activeStageId}
							color={stage.color}
							icon={stage.icon}
							onClick={setActiveStageId}
						/>
					))}
				</div>
			</header>

			<div className="contacts-content flex min-h-0 flex-none gap-3 px-3 pb-3 mobile:flex-1 mobile:px-5 mobile:pb-5">
				<section className="contacts-list-shell flex min-h-0 min-w-0 flex-1 flex-col overflow-visible rounded-2xl border border-slate-200 bg-white shadow-panel mobile:overflow-hidden dark:border-[#223138] dark:bg-[#0e181e]">
					<div className="flex min-h-12 shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-3 dark:border-[#223138] mobile:px-4">
						<div className="flex min-w-0 items-center gap-2">
							<MdFilterList className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
							<span className="whitespace-nowrap text-[10px] font-semibold text-slate-500 dark:text-slate-400">
								{filteredContacts.length} {filteredContacts.length === 1 ? 'contato' : 'contatos'}
							</span>
							<span className="hidden h-4 w-px bg-slate-200 dark:bg-[#223138] mobile:block" />
							<div className="scrollbar-none hidden gap-1 overflow-x-auto mobile:flex">
								<button
									type="button"
									className={twMerge(
										'whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[9px] font-semibold text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-[#17262e]',
										activeStageId === 'all' &&
											'bg-brand-50 text-brand-700 dark:bg-[#0f3826] dark:text-brand-400'
									)}
									onClick={() => setActiveStageId('all')}>
									Todos
								</button>
								{orderedStages.map(stage => (
									<button
										key={stage.id}
										type="button"
									className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[9px] font-semibold text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-[#17262e]"
										style={
											activeStageId === stage.id
												? { color: stage.color, backgroundColor: hexToRgba(stage.color, 0.12) }
												: undefined
										}
										onClick={() => setActiveStageId(stage.id)}>
									<StageIcon name={stage.icon} className="size-3" />
									{stage.name}
									</button>
								))}
							</div>
						</div>
						<div className="flex shrink-0 items-center gap-1.5">
							<Button
								theme="ghost"
								type="button"
								aria-label="Mostrar apenas favoritos"
								aria-pressed={favoriteOnly}
								className={twMerge(
									'size-8 min-h-8 rounded-lg p-0',
									favoriteOnly &&
										'bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400'
								)}
								onClick={() => setFavoriteOnly(value => !value)}>
								<MdStar aria-hidden="true" />
							</Button>
							<select
								value={sort}
								onChange={event => setSort(event.target.value as 'recent' | 'name')}
								aria-label="Ordenar contatos"
								className="h-8 max-w-28 rounded-lg border border-slate-200 bg-white px-2 text-[9px] font-medium text-slate-500 outline-none focus:border-brand-500 dark:border-[#223138] dark:bg-[#131f26] dark:text-slate-300">
								<option value="recent">Mais recentes</option>
								<option value="name">Nome A–Z</option>
							</select>
						</div>
					</div>

					<ContactList
						contacts={pagination.pageItems}
						stages={orderedStages}
						selectedContactId={contactId}
						onSelect={handleSelectContact}
						onToggleFavorite={toggleFavorite}
					/>
					<Pagination
						page={pagination.page}
						pageSize={pagination.pageSize}
						totalItems={pagination.totalItems}
						itemLabel="contatos"
						singularItemLabel="contato"
						onPageChange={pagination.setPage}
						onPageSizeChange={pagination.setPageSize}
					/>
				</section>

				{contactId && selectedContact && (
					<ContactDetails
						contact={selectedContact}
						stage={selectedStage}
						isOpen
						onClose={goToContacts}
						onEdit={contact => {
							setEditingContact(contact);
							setFormOpen(true);
						}}
						onOpenConversation={contact => navigate(uid ? `/w/${uid}/chats/${contact.id}` : '/')}
						onSaveNotes={updateNotes}
						onArchive={stages.some(stage => stage.id === 'inactive') ? handleArchive : undefined}
					/>
				)}
			</div>

			{formOpen && (
				<ContactFormModal
					contact={editingContact}
					stages={orderedStages}
					onClose={() => {
						setFormOpen(false);
						setEditingContact(undefined);
					}}
					onSave={handleSaveContact}
				/>
			)}

			<div
				role="status"
				aria-live="polite"
				className={twMerge(
					'pointer-events-none fixed bottom-20 left-1/2 z-60 -translate-x-1/2 translate-y-4 rounded-full bg-slate-900 px-4 py-2 text-[10px] font-semibold text-white opacity-0 shadow-xl transition mobile:bottom-6 dark:bg-white dark:text-slate-900',
					toast && 'translate-y-0 opacity-100'
				)}>
				{toast}
			</div>
		</div>
	);
};
