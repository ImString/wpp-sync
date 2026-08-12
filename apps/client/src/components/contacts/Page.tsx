import { useEffect, useMemo, useRef, useState } from 'react';
import { MdAdd, MdDownload, MdFilterList, MdGroups, MdTune } from 'react-icons/md';
import { useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import { useShallow } from 'zustand/react/shallow';

import { contactsAPI, getResponseMessage, type ContactData, type ContactOrder } from '@/utils/api';

import { Button } from '@/components/buttons';
import { Pagination } from '@/components/pagination';

import { ContactDetails } from './ContactDetails';
import { ContactFormModal } from './ContactFormModal';
import { ContactList } from './ContactList';
import type { ContactsLayoutContext } from './Layout';
import { hexToRgba } from './stageColors';
import { StageIcon } from './stageIcons';
import { type ContactListQuery, useContactsStore } from './store';
import type { Contact, ContactDraft, StageIconName } from './types';

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
				'flex min-w-36.25 cursor-pointer flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-[#223138] dark:bg-[#0e181e] dark:hover:border-[#344851] dark:hover:bg-[#101c22]'
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
	const navigateRef = useRef(navigate);
	navigateRef.current = navigate;
	const { uid, contactId } = useParams<{ uid: string; contactId?: string }>();
	const [searchParams, setSearchParams] = useSearchParams();
	const urlQuery = searchParams.toString();
	const { search, createRequest } = useOutletContext<ContactsLayoutContext>();
	const {
		contacts,
		contactsTotal,
		workspaceContactsTotal,
		contactDetails,
		stages,
		contactsStatus,
		contactsError,
		loadContacts,
		loadContact,
		loadData,
		createContact,
		updateContact,
		deleteContact,
		updateNotes
	} = useContactsStore(
		useShallow(state => ({
			contacts: state.contacts,
			contactsTotal: state.contactsTotal,
			workspaceContactsTotal: state.workspaceContactsTotal,
			contactDetails: state.contactDetails,
			stages: state.stages,
			contactsStatus: state.contactsStatus,
			contactsError: state.contactsError,
			loadContacts: state.loadContacts,
			loadContact: state.loadContact,
			loadData: state.loadData,
			createContact: state.createContact,
			updateContact: state.updateContact,
			deleteContact: state.deleteContact,
			updateNotes: state.updateNotes
		}))
	);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(5);
	const [debouncedSearch, setDebouncedSearch] = useState(search.trim());
	const [refreshVersion, setRefreshVersion] = useState(0);
	const [formOpen, setFormOpen] = useState(false);
	const [editingContact, setEditingContact] = useState<Contact>();
	const [toast, setToast] = useState('');
	const previousCreateRequest = useRef(createRequest);
	const previousRefreshVersion = useRef(refreshVersion);
	const currentContactId = useRef(contactId);
	currentContactId.current = contactId;
	const orderedStages = useMemo(() => [...stages].sort((first, second) => first.order - second.order), [stages]);
	const stepSlug = (searchParams.get('step') || '').trim().toLowerCase();
	const filteredStage = orderedStages.find(stage => stage.slug === stepSlug);
	const activeStageId = filteredStage?.id || 'all';
	const sort: ContactOrder = searchParams.get('order') === 'name' ? 'name' : 'recent';
	const selectedContact =
		contacts.find(contact => contact.id === contactId) ||
		(contactDetails?.id === contactId ? contactDetails : undefined);
	const selectedStage = orderedStages.find(stage => stage.id === selectedContact?.stageId);
	const listQuery = useMemo<ContactListQuery>(
		() => ({
			page,
			limit: pageSize,
			search: debouncedSearch || undefined,
			stage: activeStageId === 'all' ? undefined : activeStageId,
			order: sort
		}),
		[activeStageId, debouncedSearch, page, pageSize, sort]
	);
	const listRequestKey = useMemo(
		() => JSON.stringify({ uid, ...listQuery, refreshVersion }),
		[listQuery, refreshVersion, uid]
	);
	const previousListRequestKey = useRef<string | undefined>(undefined);

	useEffect(() => {
		const nextParams = new URLSearchParams(urlQuery);
		const rawStep = nextParams.get('step');
		const normalizedStep = rawStep?.trim().toLowerCase() || '';
		let changed = false;

		if (rawStep && !orderedStages.some(stage => stage.slug === normalizedStep)) {
			nextParams.delete('step');
			changed = true;
		} else if (rawStep && rawStep !== normalizedStep) {
			nextParams.set('step', normalizedStep);
			changed = true;
		}

		if (nextParams.has('order') && nextParams.get('order') !== 'name') {
			nextParams.delete('order');
			changed = true;
		}

		if (changed) setSearchParams(nextParams, { replace: true });
	}, [orderedStages, setSearchParams, urlQuery]);

	useEffect(() => {
		const timeout = window.setTimeout(() => {
			setDebouncedSearch(search.trim());
			setPage(1);
		}, 300);

		return () => window.clearTimeout(timeout);
	}, [search]);

	useEffect(() => {
		if (!uid) return;

		const isReload =
			previousListRequestKey.current !== undefined && previousListRequestKey.current !== listRequestKey;
		const forceReload = previousRefreshVersion.current !== refreshVersion;
		previousListRequestKey.current = listRequestKey;
		previousRefreshVersion.current = refreshVersion;

		if (isReload && currentContactId.current) {
			navigateRef.current(`/w/${uid}/contacts${urlQuery ? `?${urlQuery}` : ''}`, { replace: true });
		}

		const controller = new AbortController();
		void loadContacts(uid, listQuery, controller.signal, forceReload).catch(() => undefined);
		return () => controller.abort();
	}, [listQuery, listRequestKey, loadContacts, uid, urlQuery]);

	useEffect(() => {
		if (createRequest !== previousCreateRequest.current) {
			previousCreateRequest.current = createRequest;
			setEditingContact(undefined);
			setFormOpen(true);
		}
	}, [createRequest]);

	useEffect(() => {
		if (!contactId || selectedContact || !uid) return;

		const controller = new AbortController();
		void loadContact(uid, contactId, controller.signal).catch(() => {
			if (!controller.signal.aborted) {
				navigate(`/w/${uid}/contacts${urlQuery ? `?${urlQuery}` : ''}`, { replace: true });
			}
		});

		return () => controller.abort();
	}, [contactId, loadContact, navigate, selectedContact, uid, urlQuery]);

	useEffect(() => {
		if (!toast) return;

		const timeout = window.setTimeout(() => setToast(''), 2400);
		return () => window.clearTimeout(timeout);
	}, [toast]);

	useEffect(() => setPage(1), [activeStageId, sort]);

	useEffect(() => {
		const totalPages = Math.max(1, Math.ceil(contactsTotal / pageSize));
		if (page > totalPages) setPage(totalPages);
	}, [contactsTotal, page, pageSize]);

	const handleStageChange = (stageId: string) => {
		const stage = orderedStages.find(item => item.id === stageId);
		setSearchParams(current => {
			const nextParams = new URLSearchParams(current);
			if (stage) nextParams.set('step', stage.slug);
			else nextParams.delete('step');
			return nextParams;
		});
		setPage(1);
	};

	const handleOrderChange = (order: ContactOrder) => {
		setSearchParams(current => {
			const nextParams = new URLSearchParams(current);
			if (order === 'name') nextParams.set('order', 'name');
			else nextParams.delete('order');
			return nextParams;
		});
		setPage(1);
	};

	const refreshListAndCounts = () => {
		setRefreshVersion(version => version + 1);
		if (uid) void loadData(uid, undefined, true).catch(() => undefined);
	};

	const goToContacts = () => {
		if (uid) navigate(`/w/${uid}/contacts${urlQuery ? `?${urlQuery}` : ''}`);
	};

	const handleSelectContact = (nextContactId: string) => {
		if (uid) navigate(`/w/${uid}/contacts/${nextContactId}${urlQuery ? `?${urlQuery}` : ''}`);
	};

	const handleSaveContact = async (draft: ContactDraft, currentContactId?: string) => {
		if (!uid) throw new Error('Área de trabalho não identificada.');

		if (currentContactId) {
			await updateContact(uid, currentContactId, draft);
			setToast('Contato atualizado com sucesso.');
		} else {
			const contact = await createContact(uid, draft);
			setToast('Novo contato adicionado.');
			setPage(1);
			navigate(`/w/${uid}/contacts/${contact.id}${urlQuery ? `?${urlQuery}` : ''}`);
		}

		refreshListAndCounts();
		setFormOpen(false);
		setEditingContact(undefined);
	};

	const handleDelete = async (currentContactId: string) => {
		if (!uid) throw new Error('Área de trabalho não identificada.');
		await deleteContact(uid, currentContactId);
		setToast('Contato excluído.');
		navigate(`/w/${uid}/contacts${urlQuery ? `?${urlQuery}` : ''}`, { replace: true });
		refreshListAndCounts();
	};

	const handleExport = async () => {
		if (!uid) return;

		try {
			const getPage = async (currentPage: number) => {
				const response = await contactsAPI.list(uid, { ...listQuery, page: currentPage, limit: 100 });
				if (!response.success || !response.data) {
					throw new Error(getResponseMessage(response, 'Não foi possível exportar os contatos.'));
				}
				return response.data;
			};

			const firstPage = await getPage(1);
			const totalPages = Math.ceil(firstPage.total / 100);
			const remainingPages = await Promise.all(
				Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => getPage(index + 2))
			);
			const exportContacts: ContactData[] = [
				...firstPage.items,
				...remainingPages.flatMap(result => result.items)
			];
			const rows = [
				['Nome', 'Telefone', 'E-mail', 'Etapa', 'Tags', 'Criado em'],
				...exportContacts.map(contact => [
					contact.name || contact.pushName || contact.whatsapp,
					contact.whatsapp,
					contact.email || '',
					contact.stage?.name || '',
					(contact.tags || []).join(' | '),
					contact.createdAt || ''
				])
			];
			const csv = rows.map(row => row.map(escapeCsvValue).join(';')).join('\n');
			const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
			const link = document.createElement('a');
			link.href = url;
			link.download = 'contatos-wppsync.csv';
			link.click();
			URL.revokeObjectURL(url);
			setToast(`${exportContacts.length} contatos exportados.`);
		} catch (error) {
			setToast(error instanceof Error ? error.message : 'Não foi possível exportar os contatos.');
		}
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
						<p className="mt-1 text-xs text-slate-500 dark:text-slate-400 mobile:text-[11px]">
							Gerencie pessoas, leads e clientes em um só lugar.
						</p>
					</div>
					<div className="flex shrink-0 items-center gap-2">
						<Button
							theme="secondary"
							type="button"
							aria-label="Gerenciar etapas"
							className="h-9 min-h-9 px-2.5 text-xs mobile:px-3"
							onClick={() => uid && navigate(`/w/${uid}/contacts/stages`)}>
							<MdTune aria-hidden="true" />
							<span className="hidden mobile:inline">Etapas</span>
						</Button>
						<Button
							theme="secondary"
							type="button"
							className="hidden h-9 min-h-9 px-3 text-xs mobile:inline-flex"
							onClick={handleExport}>
							<MdDownload aria-hidden="true" />
							Exportar
						</Button>
						<Button
							type="button"
							className="h-9 min-h-9 px-3 text-xs shadow-[0_8px_20px_rgba(37,211,102,.2)]"
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
						value={workspaceContactsTotal}
						stageId="all"
						activeStageId={activeStageId}
						color="#8b5cf6"
						all
						onClick={handleStageChange}
					/>
					{orderedStages.map(stage => (
						<StatCard
							key={stage.id}
							label={stage.name}
							value={stage.contactCount}
							stageId={stage.id}
							activeStageId={activeStageId}
							color={stage.color}
							icon={stage.icon}
							onClick={handleStageChange}
						/>
					))}
				</div>
			</header>

			<div className="contacts-content flex min-h-0 flex-none gap-3 px-3 pb-3 mobile:flex-1 mobile:px-5 mobile:pb-5">
				<section className="contacts-list-shell flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-panel dark:border-[#223138] dark:bg-[#0e181e]">
					<div className="flex min-h-12 shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-3 dark:border-[#223138] mobile:px-4">
						<div className="flex min-w-0 items-center gap-2">
							<MdFilterList className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
							<span className="whitespace-nowrap text-xs font-semibold text-slate-500 dark:text-slate-400">
								{contactsTotal} {contactsTotal === 1 ? 'contato' : 'contatos'}
							</span>
							<span className="hidden h-4 w-px bg-slate-200 dark:bg-[#223138] mobile:block" />
							<div className="scrollbar-none hidden gap-1 overflow-x-auto mobile:flex">
								<button
									type="button"
									className={twMerge(
										'whitespace-nowrap cursor-pointer rounded-lg px-2.5 py-1.5 text-[9px] font-semibold text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-[#17262e]',
										activeStageId === 'all' &&
											'bg-brand-50 text-brand-700 dark:bg-[#0f3826] dark:text-brand-400'
									)}
									onClick={() => handleStageChange('all')}>
									Todos
								</button>
								{orderedStages.map(stage => (
									<button
										key={stage.id}
										type="button"
										className="inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[9px] font-semibold text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-[#17262e]"
										style={
											activeStageId === stage.id
												? { color: stage.color, backgroundColor: hexToRgba(stage.color, 0.12) }
												: undefined
										}
										onClick={() => handleStageChange(stage.id)}>
										<StageIcon name={stage.icon} className="size-3" />
										{stage.name}
									</button>
								))}
							</div>
						</div>
						<div className="flex shrink-0 items-center gap-1.5">
							<select
								value={sort}
								onChange={event => handleOrderChange(event.target.value as ContactOrder)}
								aria-label="Ordenar contatos"
								className="h-8 max-w-28 rounded-lg cursor-pointer border border-slate-200 bg-white px-2 text-[9px] font-medium text-slate-500 outline-none focus:border-brand-500 dark:border-[#223138] dark:bg-[#131f26] dark:text-slate-300">
								<option value="recent">Mais recentes</option>
								<option value="name">Nome A–Z</option>
							</select>
						</div>
					</div>

					<ContactList
						contacts={contacts}
						stages={orderedStages}
						loading={contactsStatus === 'loading'}
						error={contactsStatus === 'error' ? contactsError || undefined : undefined}
						skeletonCount={pageSize}
						selectedContactId={contactId}
						onSelect={handleSelectContact}
					/>
					<Pagination
						page={page}
						pageSize={pageSize}
						totalItems={contactsStatus === 'error' ? 0 : contactsTotal}
						disabled={contactsStatus === 'loading'}
						itemLabel="contatos"
						singularItemLabel="contato"
						onPageChange={setPage}
						onPageSizeChange={nextPageSize => {
							setPageSize(nextPageSize);
							setPage(1);
						}}
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
						onSaveNotes={(currentContactId, notes) => {
							if (!uid) return Promise.reject(new Error('Área de trabalho não identificada.'));
							return updateNotes(uid, currentContactId, notes).then(() => setToast('Nota salva.'));
						}}
						onDelete={handleDelete}
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
					'pointer-events-none fixed bottom-20 left-1/2 z-60 -translate-x-1/2 translate-y-4 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white opacity-0 shadow-xl transition mobile:bottom-6 dark:bg-white dark:text-slate-900',
					toast && 'translate-y-0 opacity-100'
				)}>
				{toast}
			</div>
		</div>
	);
};
