import { useEffect, useRef, useState } from 'react';
import type { IconType } from 'react-icons';
import {
	MdAdd,
	MdCheckCircle,
	MdDeleteOutline,
	MdEdit,
	MdErrorOutline,
	MdFilterList,
	MdHourglassTop,
	MdHub,
	MdLogin,
	MdOutlineSync
} from 'react-icons/md';
import { useOutletContext, useParams } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';

import { getResponseMessage, integrationsAPI } from '@/utils/api';

import { Button } from '@/components/buttons';
import { Pagination } from '@/components/pagination';
import { useSocketStore } from '@/stores';
import type { IntegrationUpdateData } from '@/stores/socket/types';

import { ChannelIcon } from './ChannelIcon';
import { IntegrationFormModal } from './IntegrationFormModal';
import type { IntegrationsLayoutContext } from './Layout';
import { NewIntegrationModal } from './NewIntegrationModal';
import { channels } from './data';
import type { ChannelDefinition, Integration, IntegrationDraft, IntegrationFilter, IntegrationStatus } from './types';

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

const integrationStatuses: IntegrationStatus[] = ['CONNECTED', 'INITIALIZING', 'AWAITING_LOGIN', 'DISCONNECTED'];

const statusMeta: Record<
	IntegrationStatus,
	{
		label: string;
		shortLabel: string;
		description: string;
		icon: IconType;
		className: string;
		color: string;
	}
> = {
	CONNECTED: {
		label: 'Conectada',
		shortLabel: 'Conectadas',
		description: 'Integração disponível para uso.',
		icon: MdCheckCircle,
		className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
		color: '#22c55e'
	},
	INITIALIZING: {
		label: 'Preparando',
		shortLabel: 'Preparando',
		description: 'A configuração inicial está sendo preparada.',
		icon: MdHourglassTop,
		className: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
		color: '#f59e0b'
	},
	AWAITING_LOGIN: {
		label: 'Aguardando login',
		shortLabel: 'Aguardando',
		description: 'A integração aguarda a autenticação do canal.',
		icon: MdLogin,
		className: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
		color: '#0ea5e9'
	},
	DISCONNECTED: {
		label: 'Desconectada',
		shortLabel: 'Desconectadas',
		description: 'A integração não está conectada no momento.',
		icon: MdErrorOutline,
		className: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
		color: '#ef4444'
	}
};

interface StatCardProps {
	label: string;
	value: number;
	filter: IntegrationFilter;
	activeFilter: IntegrationFilter;
	color: string;
	icon: IconType;
	onClick: (filter: IntegrationFilter) => void;
}

const StatCard: React.FC<StatCardProps> = props => {
	const active = props.filter === props.activeFilter;

	return (
		<button
			type="button"
			className={twMerge(
				'integrations-stat-card flex min-w-38.5 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-[#223138] dark:bg-[#0e181e] dark:hover:border-[#344851] dark:hover:bg-[#101c22]',
				active && 'is-active'
			)}
			style={
				active
					? ({ borderColor: props.color, '--integration-accent': props.color } as React.CSSProperties)
					: undefined
			}
			onClick={() => props.onClick(props.filter)}>
			<span
				className="grid size-9 shrink-0 place-items-center rounded-xl"
				style={{ color: props.color, backgroundColor: `${props.color}1f` }}>
				<props.icon className="size-5" aria-hidden="true" />
			</span>
			<span>
				<strong className="block text-lg leading-none">{props.value}</strong>
				<span className="mt-1 block whitespace-nowrap text-[9px] font-semibold uppercase tracking-[.06em] text-slate-400">
					{props.label}
				</span>
			</span>
		</button>
	);
};

const StatusBadge: React.FC<{ status: IntegrationStatus }> = ({ status }) => {
	const meta = statusMeta[status];

	return (
		<span
			className={twMerge(
				'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-semibold',
				meta.className
			)}>
			<meta.icon className="size-3" aria-hidden="true" />
			{meta.label}
		</span>
	);
};

interface IntegrationActionsProps {
	integration: Integration;
	onEdit: (integration: Integration) => void;
	onRemove: (integration: Integration) => void;
}

const IntegrationActions: React.FC<IntegrationActionsProps> = props => (
	<div className="flex items-center justify-end gap-1">
		<Button
			theme="ghost"
			type="button"
			aria-label={`Editar ${props.integration.name}`}
			className="size-8 min-h-8 rounded-lg p-0"
			onClick={() => props.onEdit(props.integration)}>
			<MdEdit aria-hidden="true" />
		</Button>
		<Button
			theme="ghost"
			type="button"
			aria-label={`Remover ${props.integration.name}`}
			className="size-8 min-h-8 rounded-lg p-0 hover:text-red-500 dark:hover:text-red-400"
			onClick={() => props.onRemove(props.integration)}>
			<MdDeleteOutline aria-hidden="true" />
		</Button>
	</div>
);

const IntegrationsListSkeleton: React.FC<{ count: number }> = ({ count }) => (
	<div className="animate-pulse motion-reduce:animate-none" role="status" aria-label="Carregando integrações">
		{Array.from({ length: Math.min(Math.max(count, 5), 8) }, (_, index) => (
			<div
				key={index}
				aria-hidden="true"
				className="grid min-h-17 grid-cols-[minmax(0,1fr)_44px] items-center gap-3 border-b border-slate-100 px-3 last:border-0 dark:border-[#1d2b32] mobile:grid-cols-[minmax(230px,1.2fr)_minmax(145px,.8fr)_minmax(140px,.75fr)_80px] mobile:gap-4 mobile:px-4">
				<div className="flex min-w-0 items-center gap-3">
					<span className="size-10 shrink-0 rounded-xl bg-slate-200 dark:bg-[#1b2a31]" />
					<span className="min-w-0 flex-1 space-y-2">
						<span className="block h-2.5 w-36 max-w-full rounded-full bg-slate-200 dark:bg-[#1b2a31]" />
						<span className="block h-2 w-24 rounded-full bg-slate-100 dark:bg-[#17262e]" />
					</span>
				</div>
				<span className="hidden h-5 w-24 rounded-full bg-slate-100 mobile:block dark:bg-[#17262e]" />
				<span className="hidden space-y-2 mobile:block">
					<span className="block h-2 w-36 rounded-full bg-slate-100 dark:bg-[#17262e]" />
					<span className="block h-2 w-24 rounded-full bg-slate-100 dark:bg-[#17262e]" />
				</span>
				<span className="ml-auto size-8 rounded-lg bg-slate-100 dark:bg-[#17262e]" />
			</div>
		))}
	</div>
);

export const IntegrationsPage: React.FC = () => {
	const { uid } = useParams<{ uid: string }>();
	const { search, createRequest } = useOutletContext<IntegrationsLayoutContext>();
	const [integrations, setIntegrations] = useState<Integration[]>([]);
	const [integrationsTotal, setIntegrationsTotal] = useState(0);
	const [statusCounts, setStatusCounts] = useState<Record<IntegrationStatus, number>>({
		CONNECTED: 0,
		INITIALIZING: 0,
		AWAITING_LOGIN: 0,
		DISCONNECTED: 0
	});
	const [listStatus, setListStatus] = useState<LoadStatus>('idle');
	const [listError, setListError] = useState('');
	const [activeFilter, setActiveFilter] = useState<IntegrationFilter>('all');
	const [debouncedSearch, setDebouncedSearch] = useState(search.trim());
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(5);
	const [refreshVersion, setRefreshVersion] = useState(0);
	const [newModalOpen, setNewModalOpen] = useState(false);
	const [formChannel, setFormChannel] = useState<ChannelDefinition>();
	const [editingIntegration, setEditingIntegration] = useState<Integration>();
	const [removeCandidate, setRemoveCandidate] = useState<Integration>();
	const [removing, setRemoving] = useState(false);
	const [removeError, setRemoveError] = useState('');
	const [toast, setToast] = useState('');
	const previousCreateRequest = useRef(createRequest);

	const [workspaceTotal, setWorkspaceTotal] = useState(0);
	const socket = useSocketStore(state => state.socket);

	useEffect(() => {
		if (!socket) return;

		const handleIntegrationUpdate = (data: IntegrationUpdateData) => {
			setIntegrations(prev =>
				prev.map(item => {
					if (item.id !== data.integrationId) return item;
					return {
						...item,
						...(data.status && { status: data.status }),
						...(data.name && { name: data.name }),
						...(data.type && { type: data.type })
					};
				})
			);
			setRefreshVersion(v => v + 1);
		};

		socket.on('integration:update', handleIntegrationUpdate);
		return () => {
			socket.off('integration:update', handleIntegrationUpdate);
		};
	}, [socket]);

	useEffect(() => {
		if (createRequest !== previousCreateRequest.current) {
			previousCreateRequest.current = createRequest;
			setNewModalOpen(true);
		}
	}, [createRequest]);

	useEffect(() => {
		const timeout = window.setTimeout(() => {
			setDebouncedSearch(search.trim());
			setPage(1);
		}, 300);

		return () => window.clearTimeout(timeout);
	}, [search]);

	useEffect(() => {
		if (!uid) return;

		const controller = new AbortController();
		setListStatus('loading');
		setListError('');

		void integrationsAPI
			.list(uid, {
				page,
				limit: pageSize,
				search: debouncedSearch || undefined,
				status: activeFilter === 'all' ? undefined : activeFilter,
				signal: controller.signal
			})
			.then(response => {
				if (!response.success || !response.data) {
					throw new Error(getResponseMessage(response, 'Não foi possível carregar as integrações.'));
				}

				setIntegrations(response.data.items);
				setIntegrationsTotal(response.data.total);
				setListStatus('ready');
			})
			.catch(error => {
				if (controller.signal.aborted) return;
				setListError(error instanceof Error ? error.message : 'Não foi possível carregar as integrações.');
				setListStatus('error');
			});

		return () => controller.abort();
	}, [activeFilter, debouncedSearch, page, pageSize, refreshVersion, uid]);

	useEffect(() => {
		if (!uid) return;

		const controller = new AbortController();
		void integrationsAPI
			.allCount(uid, controller.signal)
			.then(response => {
				if (!response.success || !response.data || controller.signal.aborted) return;
				setWorkspaceTotal(response.data.total);
				setStatusCounts(response.data.byStatus);
			})
			.catch(() => undefined);

		return () => controller.abort();
	}, [refreshVersion, uid]);

	useEffect(() => {
		const totalPages = Math.max(1, Math.ceil(integrationsTotal / pageSize));
		if (page > totalPages) setPage(totalPages);
	}, [integrationsTotal, page, pageSize]);

	useEffect(() => {
		if (!toast) return;
		const timeout = window.setTimeout(() => setToast(''), 2400);
		return () => window.clearTimeout(timeout);
	}, [toast]);

	const handleFilterChange = (filter: IntegrationFilter) => {
		setActiveFilter(filter);
		setPage(1);
	};

	const handleSelectChannel = (channel: ChannelDefinition) => {
		if (channel.disabled) return;
		setNewModalOpen(false);
		setEditingIntegration(undefined);
		setFormChannel(channel);
	};

	const handleEdit = (integration: Integration) => {
		const channel = channels.find(item => item.type === integration.type);
		if (!channel) return;
		setEditingIntegration(integration);
		setFormChannel(channel);
	};

	const handleSave = async (draft: IntegrationDraft, integrationId?: string) => {
		if (!uid) throw new Error('Área de trabalho não encontrada.');

		if (integrationId) {
			const response = await integrationsAPI.update(uid, integrationId, { name: draft.name });
			if (!response.success) {
				throw new Error(getResponseMessage(response, 'Não foi possível atualizar a integração.'));
			}
			setToast('Integração atualizada.');
		} else {
			const response = await integrationsAPI.create(uid, draft);
			if (!response.success || !response.data) {
				throw new Error(getResponseMessage(response, 'Não foi possível vincular a integração.'));
			}
			setPage(1);
			setToast('Integração vinculada com sucesso.');
		}

		setFormChannel(undefined);
		setEditingIntegration(undefined);
		setRefreshVersion(version => version + 1);
	};

	const confirmRemove = async () => {
		if (!removeCandidate || !uid) return;
		setRemoving(true);
		setRemoveError('');

		try {
			const response = await integrationsAPI.delete(uid, removeCandidate.id);
			if (!response.success) {
				throw new Error(getResponseMessage(response, 'Não foi possível remover a integração.'));
			}

			setToast(`${removeCandidate.name} removida.`);
			setRemoveCandidate(undefined);
			setRefreshVersion(version => version + 1);
		} catch (error) {
			setRemoveError(error instanceof Error ? error.message : 'Não foi possível remover a integração.');
		} finally {
			setRemoving(false);
		}
	};

	return (
		<div className="relative flex min-h-0 flex-col overflow-hidden bg-slate-50 dark:bg-[#0b151a]">
			<header className="shrink-0 px-3 pb-3 pt-4 mobile:px-5 mobile:pb-4 mobile:pt-5">
				<div className="flex items-end justify-between gap-3">
					<div>
						<p className="text-[9px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-500">
							Conectividade
						</p>
						<h1 className="mt-1 text-xl font-bold tracking-[-.04em] mobile:text-2xl">Integrações</h1>
						<p className="mt-1 text-xs text-slate-500 dark:text-slate-400 mobile:text-[11px]">
							Vincule e gerencie os canais desta área de trabalho.
						</p>
					</div>
					<Button
						type="button"
						className="h-9 min-h-9 px-3 text-xs shadow-[0_8px_20px_rgba(37,211,102,.2)]"
						onClick={() => setNewModalOpen(true)}>
						<MdAdd className="size-4" aria-hidden="true" />
						<span className="hidden mobile:inline">Nova integração</span>
						<span className="mobile:hidden">Novo</span>
					</Button>
				</div>

				<div className="scrollbar-none -mx-3 mt-4 flex gap-2 overflow-x-auto px-3 py-1 mobile:mx-0 mobile:px-0">
					<StatCard
						label="Todos os canais"
						value={workspaceTotal}
						filter="all"
						activeFilter={activeFilter}
						color="#8b5cf6"
						icon={MdHub}
						onClick={handleFilterChange}
					/>
					{integrationStatuses.map(status => (
						<StatCard
							key={status}
							label={statusMeta[status].shortLabel}
							value={statusCounts[status]}
							filter={status}
							activeFilter={activeFilter}
							color={statusMeta[status].color}
							icon={statusMeta[status].icon}
							onClick={handleFilterChange}
						/>
					))}
				</div>
			</header>

			<div className="flex min-h-0 flex-1 px-3 pb-3 mobile:px-5 mobile:pb-5">
				<section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-panel dark:border-[#223138] dark:bg-[#0e181e]">
					<div className="flex min-h-12 shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-3 dark:border-[#223138] mobile:px-4">
						<div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
							<MdFilterList className="size-4" aria-hidden="true" />
							<span className="text-xs font-semibold">
								{integrationsTotal} {integrationsTotal === 1 ? 'integração' : 'integrações'}
							</span>
						</div>
						<div className="scrollbar-none flex max-w-[70%] items-center gap-1 overflow-x-auto rounded-lg bg-slate-50 p-0.5 dark:bg-[#131f26]">
							{(['all', ...integrationStatuses] as IntegrationFilter[]).map(filter => (
								<button
									key={filter}
									type="button"
									className={twMerge(
										'shrink-0 rounded-md px-2 py-1.5 text-[9px] font-semibold text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200',
										activeFilter === filter &&
											'bg-white text-slate-900 shadow-sm dark:bg-[#0e181e] dark:text-white'
									)}
									onClick={() => handleFilterChange(filter)}>
									{filter === 'all' ? 'Todos' : statusMeta[filter].shortLabel}
								</button>
							))}
						</div>
					</div>

					<div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
						{listStatus === 'loading' ? (
							<IntegrationsListSkeleton count={pageSize} />
						) : listStatus === 'error' ? (
							<div className="grid h-full min-h-56 place-items-center p-6 text-center">
								<div>
									<span className="mx-auto grid size-12 place-items-center rounded-2xl bg-red-50 text-xl text-red-500 dark:bg-red-500/10">
										<MdErrorOutline aria-hidden="true" />
									</span>
									<h3 className="mt-3 text-sm font-semibold">
										Não foi possível carregar as integrações
									</h3>
									<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{listError}</p>
									<Button
										theme="secondary"
										type="button"
										className="mt-4 h-9 min-h-9 px-3 text-xs"
										onClick={() => setRefreshVersion(version => version + 1)}>
										Tentar novamente
									</Button>
								</div>
							</div>
						) : integrations.length ? (
							<>
								<div className="hidden min-w-180 mobile:block">
									<div className="grid grid-cols-[minmax(230px,1.2fr)_minmax(145px,.8fr)_minmax(140px,.75fr)_80px] gap-4 border-b border-slate-200 bg-slate-50/70 px-4 py-3 text-[9px] font-bold uppercase tracking-[.08em] text-slate-400 dark:border-[#223138] dark:bg-[#101b21]">
										<span>Canal</span>
										<span>Status</span>
										<span>Informações</span>
										<span className="text-right">Ações</span>
									</div>
									{integrations.map(integration => {
										const channel = channels.find(item => item.type === integration.type);
										return (
											<article
												key={integration.id}
												className="grid grid-cols-[minmax(230px,1.2fr)_minmax(145px,.8fr)_minmax(140px,.75fr)_80px] items-center gap-4 border-b border-slate-100 px-4 py-3.5 last:border-b-0 hover:bg-slate-50/70 dark:border-[#1d2b32] dark:hover:bg-[#101b21]">
												<div className="flex min-w-0 items-center gap-3">
													<ChannelIcon type={integration.type} />
													<div className="min-w-0">
														<h3 className="truncate text-xs font-semibold">
															{integration.name}
														</h3>
														<p className="mt-1 truncate text-[9px] text-slate-500 dark:text-slate-400">
															{channel?.name || integration.type}
														</p>
													</div>
												</div>
												<div>
													<StatusBadge status={integration.status} />
												</div>
												<p className="text-[9px] leading-4 text-slate-500 dark:text-slate-400">
													{statusMeta[integration.status].description}
												</p>
												<IntegrationActions
													integration={integration}
													onEdit={handleEdit}
													onRemove={setRemoveCandidate}
												/>
											</article>
										);
									})}
								</div>

								<div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2 p-2.5 mobile:hidden">
									{integrations.map(integration => {
										const channel = channels.find(item => item.type === integration.type);
										return (
											<article
												key={integration.id}
												className="min-w-0 rounded-2xl border border-slate-200 p-3.5 dark:border-[#223138]">
												<div className="flex items-start gap-3">
													<ChannelIcon type={integration.type} />
													<div className="min-w-0 flex-1">
														<h3 className="truncate text-xs font-semibold">
															{integration.name}
														</h3>
														<p className="mt-1 truncate text-[9px] text-slate-500 dark:text-slate-400">
															{channel?.name || integration.type}
														</p>
													</div>
													<StatusBadge status={integration.status} />
												</div>
												<div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-[#1d2b32]">
													<p className="text-[9px] leading-4 text-slate-500 dark:text-slate-400">
														{statusMeta[integration.status].description}
													</p>
													<IntegrationActions
														integration={integration}
														onEdit={handleEdit}
														onRemove={setRemoveCandidate}
													/>
												</div>
											</article>
										);
									})}
								</div>
							</>
						) : (
							<div className="grid h-full min-h-56 place-items-center p-6 text-center">
								<div>
									<span className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-xl text-slate-400 dark:bg-[#131f26]">
										<MdOutlineSync aria-hidden="true" />
									</span>
									<h3 className="mt-3 text-sm font-semibold">Nenhuma integração encontrada</h3>
									<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
										Ajuste a busca ou vincule um novo canal.
									</p>
									<Button
										type="button"
										className="mt-4 h-9 min-h-9 px-3 text-xs"
										onClick={() => setNewModalOpen(true)}>
										<MdAdd aria-hidden="true" /> Nova integração
									</Button>
								</div>
							</div>
						)}
					</div>
					{listStatus !== 'error' && (
						<Pagination
							page={page}
							pageSize={pageSize}
							totalItems={integrationsTotal}
							itemLabel="integrações"
							singularItemLabel="integração"
							disabled={listStatus === 'loading'}
							onPageChange={setPage}
							onPageSizeChange={nextPageSize => {
								setPageSize(nextPageSize);
								setPage(1);
							}}
						/>
					)}
				</section>
			</div>

			{newModalOpen && (
				<NewIntegrationModal onClose={() => setNewModalOpen(false)} onSelect={handleSelectChannel} />
			)}
			{formChannel && (
				<IntegrationFormModal
					channel={formChannel}
					integration={editingIntegration}
					onClose={() => {
						setFormChannel(undefined);
						setEditingIntegration(undefined);
					}}
					onSave={handleSave}
				/>
			)}

			{removeCandidate && (
				<div
					className="fixed inset-0 z-60 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-[3px] mobile:items-center mobile:p-5"
					role="presentation"
					onMouseDown={event => {
						if (event.target === event.currentTarget && !removing) setRemoveCandidate(undefined);
					}}>
					<section
						role="alertdialog"
						aria-modal="true"
						aria-labelledby="remove-integration-title"
						className="integrations-modal w-full rounded-t-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-[#223138] dark:bg-[#0e181e] mobile:max-w-105 mobile:rounded-[22px]">
						<span className="grid size-11 place-items-center rounded-2xl bg-red-50 text-xl text-red-600 dark:bg-red-500/10 dark:text-red-400">
							<MdDeleteOutline aria-hidden="true" />
						</span>
						<h2 id="remove-integration-title" className="mt-4 text-base font-bold">
							Remover integração?
						</h2>
						<p className="mt-2 text-xs leading-4 text-slate-500 dark:text-slate-400">
							“{removeCandidate.name}” será desvinculada desta área de trabalho.
						</p>
						{removeError && (
							<p role="alert" className="mt-3 text-xs text-red-500">
								{removeError}
							</p>
						)}
						<div className="mt-5 flex justify-end gap-2">
							<Button
								theme="secondary"
								type="button"
								disabled={removing}
								onClick={() => setRemoveCandidate(undefined)}>
								Cancelar
							</Button>
							<Button
								theme="danger"
								type="button"
								loading={removing}
								loadingLabel="Removendo..."
								onClick={confirmRemove}>
								Remover
							</Button>
						</div>
					</section>
				</div>
			)}

			<div
				role="status"
				aria-live="polite"
				className={twMerge(
					'pointer-events-none fixed bottom-20 left-1/2 z-70 -translate-x-1/2 translate-y-4 whitespace-nowrap rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white opacity-0 shadow-xl transition mobile:bottom-6 dark:bg-white dark:text-slate-900',
					toast && 'translate-y-0 opacity-100'
				)}>
				{toast}
			</div>
		</div>
	);
};
