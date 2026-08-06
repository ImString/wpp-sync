import { useEffect, useMemo, useState } from 'react';
import {
	MdArrowForward,
	MdChatBubbleOutline,
	MdCheckCircle,
	MdClose,
	MdErrorOutline,
	MdPersonAddAlt1
} from 'react-icons/md';
import { useNavigate, useParams } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';

import { formatNationalPhone } from '@/utils';
import { contactsAPI, getResponseMessage, type ContactData } from '@/utils/api';

import { Button } from '@/components/buttons';
import { ContactAvatar } from '@/components/contacts/Avatar';
import { ContactFormModal } from '@/components/contacts/ContactFormModal';
import { useContactsStore } from '@/components/contacts/store';
import type { ContactDraft } from '@/components/contacts/types';
import { SearchInput } from '@/components/inputs';
import { Pagination } from '@/components/pagination';

import { useChatStore } from '../store';

const PAGE_SIZE = 10;

const normalizePhone = (value: string) => value.replace(/\D/g, '');

const getContactName = (contact: ContactData) =>
	contact.name?.trim() || contact.pushName?.trim() || formatNationalPhone(contact.whatsapp) || contact.whatsapp;

const getInitials = (name: string) =>
	name
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map(part => part[0]?.toUpperCase())
		.join('');

const ContactRowsSkeleton: React.FC = () => (
	<div className="grid gap-1 p-2" role="status" aria-label="Carregando contatos">
		{Array.from({ length: 6 }, (_, index) => (
			<div
				key={index}
				aria-hidden="true"
				className="flex animate-pulse items-center gap-3 rounded-xl px-3 py-2.5 motion-reduce:animate-none">
				<span className="size-10 shrink-0 rounded-full bg-slate-200 dark:bg-[#1b2a31]" />
				<span className="flex-1 space-y-2">
					<span className="block h-2.5 w-36 rounded-full bg-slate-200 dark:bg-[#1b2a31]" />
					<span className="block h-2 w-24 rounded-full bg-slate-100 dark:bg-[#17262e]" />
				</span>
				<span className="h-8 w-24 rounded-lg bg-slate-100 dark:bg-[#17262e]" />
			</div>
		))}
	</div>
);

export const NewConversationModal: React.FC = () => {
	const navigate = useNavigate();
	const { uid } = useParams<{ uid: string }>();
	const { closeNewConversation, conversations, startConversation } = useChatStore(
		useShallow(state => ({
			closeNewConversation: state.closeNewConversation,
			conversations: state.conversations,
			startConversation: state.startConversation
		}))
	);
	const { stages, createContact, loadData } = useContactsStore(
		useShallow(state => ({
			stages: state.stages,
			createContact: state.createContact,
			loadData: state.loadData
		}))
	);
	const [contacts, setContacts] = useState<ContactData[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(PAGE_SIZE);
	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
	const [error, setError] = useState('');
	const [contactFormOpen, setContactFormOpen] = useState(false);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return;
			if (contactFormOpen) setContactFormOpen(false);
			else closeNewConversation();
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [closeNewConversation, contactFormOpen]);

	useEffect(() => {
		const timeout = window.setTimeout(() => {
			setDebouncedSearch(search.trim());
			setPage(1);
		}, 250);

		return () => window.clearTimeout(timeout);
	}, [search]);

	useEffect(() => {
		if (!uid) return;

		const controller = new AbortController();
		void loadData(uid, controller.signal).catch(() => undefined);
		return () => controller.abort();
	}, [loadData, uid]);

	useEffect(() => {
		if (!uid) return;

		const controller = new AbortController();
		setStatus('loading');
		setError('');

		void contactsAPI
			.list(uid, {
				page,
				limit: pageSize,
				search: debouncedSearch || undefined,
				order: 'name',
				signal: controller.signal
			})
			.then(response => {
				if (!response.success || !response.data) {
					throw new Error(getResponseMessage(response, 'Não foi possível carregar os contatos.'));
				}

				setContacts(response.data.items);
				setTotal(response.data.total);
				setStatus('ready');
			})
			.catch(requestError => {
				if (controller.signal.aborted) return;
				setStatus('error');
				setError(
					requestError instanceof Error ? requestError.message : 'Não foi possível carregar os contatos.'
				);
			});

		return () => controller.abort();
	}, [debouncedSearch, page, pageSize, uid]);

	const conversationByPhone = useMemo(
		() =>
			new Map(
				conversations
					.map(conversation => [normalizePhone(conversation.phone), conversation] as const)
					.filter(([phone]) => phone.length >= 8)
			),
		[conversations]
	);

	const handleStartConversation = (contact: ContactData) => {
		if (!uid) return;

		const conversationId = startConversation({
			id: contact.id,
			name: getContactName(contact),
			phone: contact.whatsapp,
			tags: contact.tags
		});
		navigate(`/w/${uid}/chats/${conversationId}`);
	};

	const handleCreateContact = async (draft: ContactDraft) => {
		if (!uid) throw new Error('Área de trabalho não identificada.');

		const contact = await createContact(uid, draft);
		setContactFormOpen(false);
		void loadData(uid, undefined, true).catch(() => undefined);
		const conversationId = startConversation({
			id: contact.id,
			name: contact.name,
			phone: contact.phone,
			tags: contact.tags
		});
		navigate(`/w/${uid}/chats/${conversationId}`);
	};

	return (
		<>
			<div
				className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-[3px] mobile:items-center mobile:p-5"
				role="presentation"
				onMouseDown={event => {
					if (event.target === event.currentTarget) closeNewConversation();
				}}>
				<section
					role="dialog"
					aria-modal="true"
					aria-labelledby="new-conversation-title"
					className="flex h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl dark:border-[#223138] dark:bg-[#0e181e] mobile:h-[min(82dvh,720px)] mobile:max-w-180 mobile:rounded-3xl">
					<header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 dark:border-[#223138] mobile:px-5">
						<div className="flex min-w-0 items-center gap-3">
							<span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-[#0f3826] dark:text-brand-400">
								<MdChatBubbleOutline className="size-5" aria-hidden="true" />
							</span>
							<div className="min-w-0">
								<h2 id="new-conversation-title" className="truncate text-base font-bold">
									Nova conversa
								</h2>
								<p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
									Escolha um contato ou adicione uma nova pessoa.
								</p>
							</div>
						</div>
						<Button
							theme="ghost"
							type="button"
							aria-label="Fechar nova conversa"
							className="icon-button"
							onClick={closeNewConversation}>
							<MdClose aria-hidden="true" />
						</Button>
					</header>

					<div className="grid shrink-0 gap-3 border-b border-slate-200 p-3 dark:border-[#223138] mobile:grid-cols-[minmax(0,1fr)_auto] mobile:p-4">
						<SearchInput
							autoFocus
							value={search}
							onChange={event => setSearch(event.target.value)}
							placeholder="Buscar por nome, telefone, e-mail ou etapa..."
							autoComplete="off"
							containerClassName="h-10 border-slate-200 dark:border-[#223138]"
						/>
						<Button
							type="button"
							className="h-10 min-h-10 whitespace-nowrap px-3 text-xs"
							onClick={() => setContactFormOpen(true)}>
							<MdPersonAddAlt1 className="size-4" aria-hidden="true" />
							Novo contato
						</Button>
					</div>

					<div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
						{status === 'loading' ? (
							<ContactRowsSkeleton />
						) : status === 'error' ? (
							<div className="grid min-h-64 place-items-center p-6 text-center" role="alert">
								<div className="max-w-72">
									<MdErrorOutline className="mx-auto size-8 text-red-500" aria-hidden="true" />
									<h3 className="mt-3 text-sm font-semibold">Não foi possível listar os contatos</h3>
									<p className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
										{error}
									</p>
								</div>
							</div>
						) : contacts.length ? (
							<div className="grid gap-1 p-2">
								{contacts.map(contact => {
									const name = getContactName(contact);
									const existingConversation = conversationByPhone.get(
										normalizePhone(contact.whatsapp)
									);

									return (
										<button
											key={contact.id}
											type="button"
											className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand-500/40 dark:hover:bg-[#131f26]"
											onClick={() => handleStartConversation(contact)}>
											<ContactAvatar contactId={contact.id} initials={getInitials(name)} />
											<span className="min-w-0 flex-1">
												<span className="flex min-w-0 items-center gap-2">
													<strong className="truncate text-xs">{name}</strong>
													{existingConversation && (
														<span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[8px] font-semibold text-brand-700 dark:bg-[#0f3826] dark:text-brand-400">
															<MdCheckCircle aria-hidden="true" /> Já existe
														</span>
													)}
												</span>
												<span className="mt-1 block truncate text-xs text-slate-500 dark:text-slate-400">
													{formatNationalPhone(contact.whatsapp) || contact.whatsapp}
													{contact.email ? ` · ${contact.email}` : ''}
												</span>
											</span>
											<span className="hidden shrink-0 items-center gap-1 text-[9px] font-semibold text-slate-400 transition group-hover:text-brand-600 mobile:inline-flex dark:group-hover:text-brand-400">
												{existingConversation ? 'Abrir' : 'Iniciar'}
												<MdArrowForward aria-hidden="true" />
											</span>
										</button>
									);
								})}
							</div>
						) : (
							<div className="grid min-h-64 place-items-center p-6 text-center">
								<div className="max-w-72">
									<MdPersonAddAlt1
										className="mx-auto size-8 text-slate-300 dark:text-slate-600"
										aria-hidden="true"
									/>
									<h3 className="mt-3 text-sm font-semibold">
										{debouncedSearch ? 'Nenhum contato encontrado' : 'Nenhum contato cadastrado'}
									</h3>
									<p className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
										Crie um contato para começar uma nova conversa.
									</p>
									<Button
										type="button"
										className="mt-4 h-9 min-h-9 px-3 text-xs"
										onClick={() => setContactFormOpen(true)}>
										<MdPersonAddAlt1 aria-hidden="true" /> Criar contato
									</Button>
								</div>
							</div>
						)}
					</div>

					<Pagination
						page={page}
						pageSize={pageSize}
						totalItems={status === 'error' ? 0 : total}
						itemLabel="contatos"
						singularItemLabel="contato"
						pageSizeOptions={[10, 20]}
						disabled={status === 'loading'}
						onPageChange={setPage}
						onPageSizeChange={nextPageSize => {
							setPageSize(nextPageSize);
							setPage(1);
						}}
					/>
				</section>
			</div>

			{contactFormOpen && (
				<ContactFormModal
					stages={stages}
					onClose={() => setContactFormOpen(false)}
					onSave={handleCreateContact}
				/>
			)}
		</>
	);
};
