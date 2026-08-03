import { MdChevronRight, MdOutlinePeopleAlt, MdStar, MdStarBorder } from 'react-icons/md';
import { twMerge } from 'tailwind-merge';

import { Button } from '@/components/buttons';

import { ContactAvatar } from './Avatar';
import { StatusBadge } from './StatusBadge';
import type { Contact, RelationshipStage } from './types';

interface ContactListProps {
	contacts: Contact[];
	stages: RelationshipStage[];
	selectedContactId?: string;
	onSelect: (contactId: string) => void;
	onToggleFavorite: (contactId: string) => void;
}

const FavoriteButton: React.FC<{ contact: Contact; onToggle: () => void }> = ({ contact, onToggle }) => (
	<Button
		theme="ghost"
		type="button"
		aria-label={contact.favorite ? `Remover ${contact.name} dos favoritos` : `Favoritar ${contact.name}`}
		aria-pressed={contact.favorite}
		className={twMerge(
			'size-8 min-h-8 rounded-lg p-0 text-slate-300 hover:text-amber-500 dark:text-slate-600 dark:hover:text-amber-400',
			contact.favorite && 'text-amber-400 dark:text-amber-400'
		)}
		onClick={event => {
			event.stopPropagation();
			onToggle();
		}}>
		{contact.favorite ? <MdStar aria-hidden="true" /> : <MdStarBorder aria-hidden="true" />}
	</Button>
);

export const ContactList: React.FC<ContactListProps> = props => {
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
								Status
							</th>
							<th className="hidden border-b border-slate-200 px-3 py-3 font-bold dark:border-[#223138] wide:table-cell">
								Tags
							</th>
							<th className="border-b border-slate-200 px-3 py-3 font-bold dark:border-[#223138]">
								Último contato
							</th>
							<th className="w-12 border-b border-slate-200 px-2 py-3 dark:border-[#223138]" />
						</tr>
					</thead>
					<tbody>
						{props.contacts.map(contact => {
							const isSelected = props.selectedContactId === contact.id;
							const stage = props.stages.find(item => item.id === contact.stageId);

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
												<div className="flex items-center gap-1.5">
													<strong className="block max-w-40 truncate text-xs font-semibold">
														{contact.name}
													</strong>
													{contact.favorite && (
														<MdStar
															className="size-3 text-amber-400"
															aria-label="Favorito"
														/>
													)}
												</div>
												<span className="mt-0.5 block max-w-44 truncate text-[10px] text-slate-500 dark:text-slate-400">
													{contact.phone}
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
										<span className="whitespace-nowrap text-[10px] text-slate-500 dark:text-slate-400">
											{contact.lastInteraction}
										</span>
									</td>
									<td className="border-b border-slate-100 px-2 py-3 dark:border-[#1b2a31]">
										<FavoriteButton
											contact={contact}
											onToggle={() => props.onToggleFavorite(contact.id)}
										/>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			<div className="grid w-full min-h-0 flex-none grid-cols-[minmax(0,1fr)] gap-2 overflow-visible p-3 mobile:hidden">
				{props.contacts.map(contact => (
					<article
						key={contact.id}
						className="flex w-full min-w-0 cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition active:scale-[.99] dark:border-[#223138] dark:bg-[#101c22]"
						onClick={() => props.onSelect(contact.id)}>
						<ContactAvatar contactId={contact.id} initials={contact.initials} className="size-12 text-xs" />
						<div className="min-w-0 flex-1">
							<div className="flex items-center gap-2">
								<strong className="min-w-0 flex-1 truncate text-sm">{contact.name}</strong>
								<span className="shrink-0 text-[9px] text-slate-400">{contact.lastInteraction}</span>
							</div>
							<p className="mt-1 truncate text-[11px] text-slate-500 dark:text-slate-400">
								{contact.lastMessage}
							</p>
							<div className="mt-2 flex items-center gap-1.5">
								<StatusBadge stage={props.stages.find(stage => stage.id === contact.stageId)} compact />
								{contact.tags[0] && (
									<span className="truncate rounded-full bg-slate-100 px-2 py-0.5 text-[9px] text-slate-500 dark:bg-[#17262e] dark:text-slate-300">
										{contact.tags[0]}
									</span>
								)}
							</div>
						</div>
						<FavoriteButton contact={contact} onToggle={() => props.onToggleFavorite(contact.id)} />
						<MdChevronRight
							className="size-5 shrink-0 text-slate-300 dark:text-slate-600"
							aria-hidden="true"
						/>
					</article>
				))}
			</div>
		</>
	);
};
