import { useEffect, useMemo, useRef, useState } from 'react';
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
	MdOutlineSync,
	MdQrCode,
	MdRefresh,
	MdSync
} from 'react-icons/md';
import { useOutletContext } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@/components/buttons';
import { Pagination, useClientPagination } from '@/components/pagination';

import { ChannelIcon } from './ChannelIcon';
import { IntegrationFormModal } from './IntegrationFormModal';
import type { IntegrationsLayoutContext } from './Layout';
import { NewIntegrationModal } from './NewIntegrationModal';
import { WhatsAppQrModal } from './WhatsAppQrModal';
import { channels } from './data';
import { useIntegrationsStore } from './store';
import type { ChannelDefinition, Integration, IntegrationDraft, IntegrationFilter, IntegrationStatus } from './types';

const normalizeText = (value: string) =>
	value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim();

const statusMeta: Record<
	IntegrationStatus,
	{ label: string; shortLabel: string; icon: IconType; className: string; color: string }
> = {
	connected: {
		label: 'Conectado',
		shortLabel: 'Ativas',
		icon: MdCheckCircle,
		className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
		color: '#22c55e'
	},
	pending: {
		label: 'Aguardando conexão',
		shortLabel: 'Aguardando',
		icon: MdHourglassTop,
		className: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
		color: '#f59e0b'
	},
	attention: {
		label: 'Requer atenção',
		shortLabel: 'Com atenção',
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
	onConnect: (integration: Integration) => void;
	onEdit: (integration: Integration) => void;
	onRemove: (integration: Integration) => void;
	onSync: (integration: Integration) => void;
}

const IntegrationActions: React.FC<IntegrationActionsProps> = props => {
	const isWhatsApp = props.integration.type === 'whatsapp';
	const needsConnection = props.integration.status !== 'connected';

	return (
		<div className="flex flex-wrap items-center justify-end gap-1">
			{isWhatsApp && needsConnection && (
				<Button
					type="button"
					className="h-8 min-h-8 rounded-lg px-2.5 text-[9px]"
					onClick={() => props.onConnect(props.integration)}>
					<MdQrCode className="size-4" aria-hidden="true" />
					Conectar
				</Button>
			)}
			{!isWhatsApp && needsConnection && (
				<Button
					type="button"
					className="h-8 min-h-8 rounded-lg px-2.5 text-[9px]"
					onClick={() => props.onEdit(props.integration)}>
					<MdRefresh className="size-4" aria-hidden="true" />
					Reconfigurar
				</Button>
			)}
			{props.integration.status === 'connected' && (
				<Button
					theme="ghost"
					type="button"
					aria-label={`Sincronizar ${props.integration.name}`}
					className="size-8 min-h-8 rounded-lg p-0"
					onClick={() => props.onSync(props.integration)}>
					<MdSync aria-hidden="true" />
				</Button>
			)}
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
				aria-label={`Excluir ${props.integration.name}`}
				className="size-8 min-h-8 rounded-lg p-0 hover:text-red-500 dark:hover:text-red-400"
				onClick={() => props.onRemove(props.integration)}>
				<MdDeleteOutline aria-hidden="true" />
			</Button>
		</div>
	);
};

export const IntegrationsPage: React.FC = () => {
	const { search, createRequest } = useOutletContext<IntegrationsLayoutContext>();
	const { integrations, createIntegration, updateIntegration, removeIntegration, restartIntegration, markSynced } =
		useIntegrationsStore(
			useShallow(state => ({
				integrations: state.integrations,
				createIntegration: state.createIntegration,
				updateIntegration: state.updateIntegration,
				removeIntegration: state.removeIntegration,
				restartIntegration: state.restartIntegration,
				markSynced: state.markSynced
			}))
		);
	const [activeFilter, setActiveFilter] = useState<IntegrationFilter>('all');
	const [newModalOpen, setNewModalOpen] = useState(false);
	const [formChannel, setFormChannel] = useState<ChannelDefinition>();
	const [editingIntegration, setEditingIntegration] = useState<Integration>();
	const [qrIntegration, setQrIntegration] = useState<Integration>();
	const [removeCandidate, setRemoveCandidate] = useState<Integration>();
	const [toast, setToast] = useState('');
	const previousCreateRequest = useRef(createRequest);

	useEffect(() => {
		if (createRequest !== previousCreateRequest.current) {
			previousCreateRequest.current = createRequest;
			setNewModalOpen(true);
		}
	}, [createRequest]);

	useEffect(() => {
		if (!toast) return;

		const timeout = window.setTimeout(() => setToast(''), 2400);
		return () => window.clearTimeout(timeout);
	}, [toast]);

	const filteredIntegrations = useMemo(() => {
		const normalizedSearch = normalizeText(search);

		return integrations.filter(integration => {
			const channel = channels.find(item => item.type === integration.type);
			const searchableText = normalizeText(
				[integration.name, integration.account, channel?.name, statusMeta[integration.status].label]
					.filter(Boolean)
					.join(' ')
			);
			const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);
			const matchesFilter = activeFilter === 'all' || integration.status === activeFilter;
			return matchesSearch && matchesFilter;
		});
	}, [activeFilter, integrations, search]);
	const pagination = useClientPagination(filteredIntegrations);

	useEffect(() => {
		pagination.resetPage();
	}, [activeFilter, pagination.resetPage, search]);

	const statusCount = (status: IntegrationStatus) =>
		integrations.filter(integration => integration.status === status).length;

	const handleSelectChannel = (channel: ChannelDefinition) => {
		setNewModalOpen(false);

		if (channel.type === 'whatsapp') {
			const index = integrations.filter(integration => integration.type === 'whatsapp').length + 1;
			const integration = createIntegration({
				name: `WhatsApp ${index}`,
				account: 'Número será identificado após conectar',
				type: 'whatsapp'
			});
			pagination.resetPage();
			setQrIntegration(integration);
			setToast('Canal criado. Escaneie o QR Code para conectar.');
			return;
		}

		setEditingIntegration(undefined);
		setFormChannel(channel);
	};

	const handleEdit = (integration: Integration) => {
		const channel = channels.find(item => item.type === integration.type);
		if (!channel) return;
		setEditingIntegration(integration);
		setFormChannel(channel);
	};

	const handleSave = (draft: IntegrationDraft, integrationId?: string) => {
		if (integrationId) {
			updateIntegration(integrationId, draft);
			setToast('Integração atualizada.');
		} else {
			createIntegration(draft);
			pagination.resetPage();
			setToast('Integração conectada com sucesso.');
			// setToast(draft.type === 'whatsapp-official' ? 'Canal criado. Finalize a autorização com a Meta.' : 'Integração conectada com sucesso.');
		}

		setFormChannel(undefined);
		setEditingIntegration(undefined);
	};

	const handleConnectWhatsApp = (integration: Integration) => {
		restartIntegration(integration.id);
		setQrIntegration({ ...integration, status: 'pending', lastSync: 'Aguardando nova conexão' });
	};

	const handleSync = (integration: Integration) => {
		markSynced(integration.id);
		setToast(`${integration.name} sincronizada.`);
	};

	const confirmRemove = () => {
		if (!removeCandidate) return;
		removeIntegration(removeCandidate.id);
		setToast(`${removeCandidate.name} removida.`);
		setRemoveCandidate(undefined);
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
						<p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 mobile:text-[11px]">
							Centralize seus canais e acompanhe a saúde de cada conexão.
						</p>
					</div>
					<Button
						type="button"
						className="h-9 min-h-9 px-3 text-[10px] shadow-[0_8px_20px_rgba(37,211,102,.2)]"
						onClick={() => setNewModalOpen(true)}>
						<MdAdd className="size-4" aria-hidden="true" />
						<span className="hidden mobile:inline">Nova integração</span>
						<span className="mobile:hidden">Novo</span>
					</Button>
				</div>

				<div className="scrollbar-none -mx-3 mt-4 flex gap-2 overflow-x-auto px-3 py-1 mobile:mx-0 mobile:px-0">
					<StatCard
						label="Todos os canais"
						value={integrations.length}
						filter="all"
						activeFilter={activeFilter}
						color="#8b5cf6"
						icon={MdHub}
						onClick={setActiveFilter}
					/>
					{(['connected', 'pending', 'attention'] as const).map(status => (
						<StatCard
							key={status}
							label={statusMeta[status].shortLabel}
							value={statusCount(status)}
							filter={status}
							activeFilter={activeFilter}
							color={statusMeta[status].color}
							icon={statusMeta[status].icon}
							onClick={setActiveFilter}
						/>
					))}
				</div>
			</header>

			<div className="flex min-h-0 flex-1 px-3 pb-3 mobile:px-5 mobile:pb-5">
				<section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-panel dark:border-[#223138] dark:bg-[#0e181e]">
					<div className="flex min-h-12 shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-3 dark:border-[#223138] mobile:px-4">
						<div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
							<MdFilterList className="size-4" aria-hidden="true" />
							<span className="text-[10px] font-semibold">
								{filteredIntegrations.length}{' '}
								{filteredIntegrations.length === 1 ? 'integração' : 'integrações'}
							</span>
						</div>
						<div className="flex items-center gap-1 rounded-lg bg-slate-50 p-0.5 dark:bg-[#131f26]">
							{(['all', 'connected', 'pending', 'attention'] as const).map(filter => (
								<button
									key={filter}
									type="button"
									className={twMerge(
										'rounded-md px-2 py-1.5 text-[9px] font-semibold text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200',
										activeFilter === filter &&
											'bg-white text-slate-900 shadow-sm dark:bg-[#0e181e] dark:text-white'
									)}
									onClick={() => setActiveFilter(filter)}>
									{filter === 'all' ? 'Todos' : statusMeta[filter].shortLabel}
								</button>
							))}
						</div>
					</div>

					<div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
						{filteredIntegrations.length ? (
							<>
								<div className="hidden min-w-190 mobile:block">
									<div className="grid grid-cols-[minmax(230px,1.2fr)_minmax(145px,.8fr)_minmax(140px,.75fr)_190px] gap-4 border-b border-slate-200 bg-slate-50/70 px-4 py-3 text-[9px] font-bold uppercase tracking-[.08em] text-slate-400 dark:border-[#223138] dark:bg-[#101b21]">
										<span>Canal</span>
										<span>Status</span>
										<span>Atividade</span>
										<span className="text-right">Ações</span>
									</div>
									{pagination.pageItems.map(integration => {
										const channel = channels.find(item => item.type === integration.type);
										return (
											<article
												key={integration.id}
												className="grid grid-cols-[minmax(230px,1.2fr)_minmax(145px,.8fr)_minmax(140px,.75fr)_190px] items-center gap-4 border-b border-slate-100 px-4 py-3.5 last:border-b-0 hover:bg-slate-50/70 dark:border-[#1d2b32] dark:hover:bg-[#101b21]">
												<div className="flex min-w-0 items-center gap-3">
													<ChannelIcon type={integration.type} />
													<div className="min-w-0">
														<h3 className="truncate text-xs font-semibold">
															{integration.name}
														</h3>
														<p className="mt-1 truncate text-[9px] text-slate-500 dark:text-slate-400">
															{channel?.name} · {integration.account}
														</p>
													</div>
												</div>
												<div>
													<StatusBadge status={integration.status} />
												</div>
												<div>
													<p className="text-[9px] font-medium text-slate-600 dark:text-slate-300">
														{integration.lastSync}
													</p>
													<p className="mt-1 text-[9px] text-slate-400">
														{integration.conversations} conversas
													</p>
												</div>
												<IntegrationActions
													integration={integration}
													onConnect={handleConnectWhatsApp}
													onEdit={handleEdit}
													onRemove={setRemoveCandidate}
													onSync={handleSync}
												/>
											</article>
										);
									})}
								</div>

								<div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2 p-2.5 mobile:hidden">
									{pagination.pageItems.map(integration => {
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
															{channel?.name} · {integration.account}
														</p>
													</div>
													<StatusBadge status={integration.status} />
												</div>
												<div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-[#1d2b32]">
													<div className="min-w-0">
														<p className="truncate text-[9px] font-medium text-slate-500 dark:text-slate-400">
															{integration.lastSync}
														</p>
														<p className="mt-0.5 text-[9px] text-slate-400">
															{integration.conversations} conversas
														</p>
													</div>
													<IntegrationActions
														integration={integration}
														onConnect={handleConnectWhatsApp}
														onEdit={handleEdit}
														onRemove={setRemoveCandidate}
														onSync={handleSync}
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
									<p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
										Ajuste a busca ou conecte um novo canal.
									</p>
									<Button
										type="button"
										className="mt-4 h-9 min-h-9 px-3 text-[10px]"
										onClick={() => setNewModalOpen(true)}>
										<MdAdd aria-hidden="true" />
										Nova integração
									</Button>
								</div>
							</div>
						)}
					</div>
					<Pagination
						page={pagination.page}
						pageSize={pagination.pageSize}
						totalItems={pagination.totalItems}
						itemLabel="integrações"
						singularItemLabel="integração"
						onPageChange={pagination.setPage}
						onPageSizeChange={pagination.setPageSize}
					/>
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
			{qrIntegration && (
				<WhatsAppQrModal
					integration={qrIntegration}
					onClose={() => setQrIntegration(undefined)}
					onRefresh={() => restartIntegration(qrIntegration.id)}
				/>
			)}

			{removeCandidate && (
				<div
					className="fixed inset-0 z-60 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-[3px] mobile:items-center mobile:p-5"
					role="presentation"
					onMouseDown={event => {
						if (event.target === event.currentTarget) setRemoveCandidate(undefined);
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
						<p className="mt-2 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
							“{removeCandidate.name}” deixará de receber novas mensagens. O histórico de conversas será
							preservado.
						</p>
						<div className="mt-5 flex justify-end gap-2">
							<Button theme="secondary" type="button" onClick={() => setRemoveCandidate(undefined)}>
								Cancelar
							</Button>
							<Button theme="danger" type="button" onClick={confirmRemove}>
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
					'pointer-events-none fixed bottom-20 left-1/2 z-70 -translate-x-1/2 translate-y-4 whitespace-nowrap rounded-full bg-slate-900 px-4 py-2 text-[10px] font-semibold text-white opacity-0 shadow-xl transition mobile:bottom-6 dark:bg-white dark:text-slate-900',
					toast && 'translate-y-0 opacity-100'
				)}>
				{toast}
			</div>
		</div>
	);
};
