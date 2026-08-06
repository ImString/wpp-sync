import { MdChevronRight, MdErrorOutline, MdOutlinePeopleAlt } from 'react-icons/md';
import { twMerge } from 'tailwind-merge';

import { formatNationalPhone } from '@/utils';

import { ContactAvatar } from './Avatar';
import { StatusBadge } from './StatusBadge';
import type { Contact, RelationshipStage } from './types';

interface ContactListProps {
	contacts: Contact[];
	stages: RelationshipStage[];
	loading?: boolean;
	error?: string;
	skeletonCount?: number;
	selectedContactId?: string;
	onSelect: (contactId: string) => void;
}

const formatDate = (value?: string) => {
	if (!value) return '—';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '—';
	return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(date);
};

const ContactListSkeleton: React.FC<{ count: number }> = ({ count }) => {
	const items = Array.from({ length: Math.min(Math.max(count, 5), 8) }, (_, index) => index);

	return (
		<>
			<div
				className="hidden min-h-0 flex-1 overflow-hidden mobile:block"
				role="status"
				aria-label="Carregando contatos">
				<table className="w-full min-w-150 border-separate border-spacing-0 text-left">
					<thead className="bg-slate-50/95 text-[9px] font-bold uppercase tracking-[.08em] text-slate-400 dark:bg-[#101c22]/95 dark:text-slate-500">
						<tr>
							<th className="border-b border-slate-200 px-4 py-3 font-bold dark:border-[#223138]">
								Contato
							</th>
							<th className="border-b border-slate-200 px-3 py-3 font-bold dark:border-[#223138]">
								Etapa
							</th>
							<th className="hidden border-b border-slate-200 px-3 py-3 font-bold dark:border-[#223138] wide:table-cell">
								Tags
							</th>
							<th className="border-b border-slate-200 px-3 py-3 font-bold dark:border-[#223138]">
								Adicionado em
							</th>
						</tr>
					</thead>
					<tbody className="animate-pulse motion-reduce:animate-none">
						{items.map(item => (
							<tr key={item} aria-hidden="true">
								<td className="border-b border-slate-100 px-4 py-3 dark:border-[#1b2a31]">
									<div className="flex items-center gap-3">
										<span className="size-9 shrink-0 rounded-xl bg-slate-200 dark:bg-[#1b2a31]" />
										<div className="space-y-2">
											<span className="block h-2.5 w-28 rounded-full bg-slate-200 dark:bg-[#1b2a31]" />
											<span className="block h-2 w-20 rounded-full bg-slate-100 dark:bg-[#17262e]" />
										</div>
									</div>
								</td>
								<td className="border-b border-slate-100 px-3 py-3 dark:border-[#1b2a31]">
									<span className="block h-5 w-20 rounded-full bg-slate-200 dark:bg-[#1b2a31]" />
								</td>
								<td className="hidden border-b border-slate-100 px-3 py-3 dark:border-[#1b2a31] wide:table-cell">
									<div className="flex gap-1">
										<span className="h-5 w-14 rounded-md bg-slate-100 dark:bg-[#17262e]" />
										<span className="h-5 w-12 rounded-md bg-slate-100 dark:bg-[#17262e]" />
									</div>
								</td>
								<td className="border-b border-slate-100 px-3 py-3 dark:border-[#1b2a31]">
									<span className="block h-2 w-16 rounded-full bg-slate-100 dark:bg-[#17262e]" />
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<div className="grid w-full flex-none grid-cols-[minmax(0,1fr)] gap-2 p-3 mobile:hidden" aria-hidden="true">
				{items.map(item => (
					<div
						key={item}
						className="flex animate-pulse items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 motion-reduce:animate-none dark:border-[#223138] dark:bg-[#101c22]">
						<span className="size-12 shrink-0 rounded-2xl bg-slate-200 dark:bg-[#1b2a31]" />
						<div className="flex-1 space-y-2.5">
							<span className="block h-3 w-2/3 rounded-full bg-slate-200 dark:bg-[#1b2a31]" />
							<span className="block h-2.5 w-1/2 rounded-full bg-slate-100 dark:bg-[#17262e]" />
							<span className="block h-5 w-20 rounded-full bg-slate-100 dark:bg-[#17262e]" />
						</div>
					</div>
				))}
			</div>
		</>
	);
};

export const ContactList: React.FC<ContactListProps> = props => {
	if (props.loading) return <ContactListSkeleton count={props.skeletonCount || 5} />;

	if (props.error) {
		return (
			<div className="grid min-h-72 flex-1 place-items-center p-8 text-center" role="alert">
				<div className="max-w-72">
					<MdErrorOutline className="mx-auto size-8 text-red-500" aria-hidden="true" />
					<h3 className="mt-3 text-sm font-semibold">Não foi possível carregar os contatos</h3>
					<p className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{props.error}</p>
				</div>
			</div>
		);
	}

	if (!props.contacts.length) {
		return (
			<div className="grid min-h-72 flex-1 place-items-center p-8 text-center">
				<div className="max-w-64">
					<span className="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-[#131f26] dark:text-slate-500">
						<MdOutlinePeopleAlt className="size-7" aria-hidden="true" />
					</span>
					<h3 className="mt-4 text-sm font-semibold">Nenhum contato encontrado</h3>
					<p className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
						Tente outro termo de busca ou ajuste os filtros.
					</p>
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="hidden min-h-0 flex-1 overflow-auto mobile:block scrollbar-thin">
				<table className="w-full min-w-150 border-separate border-spacing-0 text-left">
					<thead className="sticky top-0 z-10 bg-slate-50/95 text-[9px] font-bold uppercase tracking-[.08em] text-slate-400 backdrop-blur dark:bg-[#101c22]/95 dark:text-slate-500">
						<tr>
							<th className="border-b border-slate-200 px-4 py-3 font-bold dark:border-[#223138]">
								Contato
							</th>
							<th className="border-b border-slate-200 px-3 py-3 font-bold dark:border-[#223138]">
								Etapa
							</th>
							<th className="hidden border-b border-slate-200 px-3 py-3 font-bold dark:border-[#223138] wide:table-cell">
								Tags
							</th>
							<th className="border-b border-slate-200 px-3 py-3 font-bold dark:border-[#223138]">
								Adicionado em
							</th>
						</tr>
					</thead>
					<tbody>
						{props.contacts.map(contact => {
							const isSelected = props.selectedContactId === contact.id;
							const stage = props.stages.find(item => item.id === contact.stageId);
							const formattedPhone = formatNationalPhone(contact.phone) || contact.phone;

							return (
								<tr
									key={contact.id}
									tabIndex={0}
									aria-selected={isSelected}
									className={twMerge(
										'group cursor-pointer outline-none transition hover:bg-slate-50 focus-visible:bg-brand-50/70 dark:hover:bg-[#131f26] dark:focus-visible:bg-[#0f3826]/60',
										isSelected && 'bg-brand-50/70 dark:bg-[#0f3826]/55'
									)}
									onClick={() => props.onSelect(contact.id)}
									onKeyDown={event => {
										if (event.key === 'Enter' || event.key === ' ') props.onSelect(contact.id);
									}}>
									<td className="border-b border-slate-100 px-4 py-3 dark:border-[#1b2a31]">
										<div className="flex items-center gap-3">
											<ContactAvatar contactId={contact.id} initials={contact.initials} />
											<div className="min-w-0">
												<strong className="block max-w-40 truncate text-xs font-semibold">
													{contact.name}
												</strong>
												<span className="mt-0.5 block max-w-44 truncate text-xs text-slate-500 dark:text-slate-400">
													{formattedPhone}
												</span>
											</div>
										</div>
									</td>
									<td className="border-b border-slate-100 px-3 py-3 dark:border-[#1b2a31]">
										<StatusBadge stage={stage} compact />
									</td>
									<td className="hidden border-b border-slate-100 px-3 py-3 dark:border-[#1b2a31] wide:table-cell">
										<div className="flex max-w-44 flex-wrap gap-1">
											{contact.tags.slice(0, 2).map(tag => (
												<span
													key={tag}
													className="rounded-md bg-slate-100 px-2 py-1 text-[9px] text-slate-500 dark:bg-[#17262e] dark:text-slate-300">
													{tag}
												</span>
											))}
										</div>
									</td>
									<td className="border-b border-slate-100 px-3 py-3 dark:border-[#1b2a31]">
										<span className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
											{formatDate(contact.createdAt)}
										</span>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			<div className="grid min-h-0 w-full flex-none grid-cols-[minmax(0,1fr)] gap-2 overflow-visible p-3 mobile:hidden">
				{props.contacts.map(contact => {
					const formattedPhone = formatNationalPhone(contact.phone) || contact.phone;

					return (
						<article
							key={contact.id}
							className="flex w-full min-w-0 cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition active:scale-[.99] dark:border-[#223138] dark:bg-[#101c22]"
							onClick={() => props.onSelect(contact.id)}>
							<ContactAvatar
								contactId={contact.id}
								initials={contact.initials}
								className="size-12 text-xs"
							/>
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-2">
									<strong className="min-w-0 flex-1 truncate text-sm">{contact.name}</strong>
									<span className="shrink-0 text-[9px] text-slate-400">
										{formatDate(contact.createdAt)}
									</span>
								</div>
								<p className="mt-1 truncate text-[11px] text-slate-500 dark:text-slate-400">
									{contact.email || formattedPhone}
								</p>
								<div className="mt-2 flex items-center gap-1.5">
									<StatusBadge
										stage={props.stages.find(stage => stage.id === contact.stageId)}
										compact
									/>
									{contact.tags[0] && (
										<span className="truncate rounded-full bg-slate-100 px-2 py-0.5 text-[9px] text-slate-500 dark:bg-[#17262e] dark:text-slate-300">
											{contact.tags[0]}
										</span>
									)}
								</div>
							</div>
							<MdChevronRight
								className="size-5 shrink-0 text-slate-300 dark:text-slate-600"
								aria-hidden="true"
							/>
						</article>
					);
				})}
			</div>
		</>
	);
};
