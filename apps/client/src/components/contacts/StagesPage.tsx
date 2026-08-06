import { useEffect, useMemo, useRef, useState } from 'react';
import {
	MdAdd,
	MdArrowBack,
	MdArrowDownward,
	MdArrowUpward,
	MdDeleteOutline,
	MdEdit,
	MdOutlinePeopleAlt,
	MdRoute
} from 'react-icons/md';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@/components/buttons';

import type { ContactsLayoutContext } from './Layout';
import { StageFormModal } from './StageFormModal';
import { hexToRgba } from './stageColors';
import { StageIcon } from './stageIcons';
import { useContactsStore } from './store';
import type { RelationshipStage, RelationshipStageDraft } from './types';

const normalizeText = (value: string) =>
	value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim();

interface DeleteStageModalProps {
	stage: RelationshipStage;
	stages: RelationshipStage[];
	contactCount: number;
	onClose: () => void;
	onConfirm: (replacementStageId: string) => Promise<void>;
}

const DeleteStageModal: React.FC<DeleteStageModalProps> = props => {
	const replacementStages = props.stages.filter(stage => stage.id !== props.stage.id);
	const [replacementStageId, setReplacementStageId] = useState(replacementStages[0]?.id || '');
	const [submitting, setSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');

	const handleConfirm = async () => {
		setSubmitting(true);
		setErrorMessage('');
		try {
			await props.onConfirm(replacementStageId);
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : 'Não foi possível excluir a etapa.');
			setSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-[2px]">
			<section
				role="alertdialog"
				aria-modal="true"
				aria-labelledby="delete-stage-title"
				className="w-full max-w-110 rounded-[22px] border border-slate-200 bg-white p-5 shadow-2xl dark:border-[#223138] dark:bg-[#0e181e]">
				<span className="grid size-11 place-items-center rounded-xl bg-red-50 text-red-500 dark:bg-red-500/10">
					<MdDeleteOutline className="size-5" aria-hidden="true" />
				</span>
				<h2 id="delete-stage-title" className="mt-4 text-base font-bold">
					Excluir “{props.stage.name}”?
				</h2>
				<p className="mt-1.5 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
					A etapa será removida definitivamente. Essa ação não exclui contatos.
				</p>

				{props.contactCount > 0 && (
					<label className="mt-4 block text-xs font-semibold text-slate-600 dark:text-slate-300">
						Mover {props.contactCount} {props.contactCount === 1 ? 'contato' : 'contatos'} para
						<select
							value={replacementStageId}
							onChange={event => setReplacementStageId(event.target.value)}
							className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs outline-none focus:border-brand-500 dark:border-[#223138] dark:bg-[#131f26]">
							{replacementStages.map(stage => (
								<option key={stage.id} value={stage.id}>
									{stage.name}
								</option>
							))}
						</select>
					</label>
				)}

				{errorMessage && (
					<p className="mt-4 rounded-xl bg-red-50 px-3 py-2.5 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-300">
						{errorMessage}
					</p>
				)}

				<footer className="mt-5 flex justify-end gap-2">
					<Button theme="secondary" type="button" disabled={submitting} onClick={props.onClose}>
						Cancelar
					</Button>
					<Button
						theme="danger"
						type="button"
						disabled={!replacementStageId}
						loading={submitting}
						loadingLabel="Excluindo..."
						onClick={handleConfirm}>
						Excluir etapa
					</Button>
				</footer>
			</section>
		</div>
	);
};

export const RelationshipStagesPage: React.FC = () => {
	const navigate = useNavigate();
	const { uid } = useParams<{ uid: string }>();
	const { search, createRequest } = useOutletContext<ContactsLayoutContext>();
	const { workspaceContactsTotal, stages, createStage, updateStage, deleteStage, moveStage } = useContactsStore(
		useShallow(state => ({
			workspaceContactsTotal: state.workspaceContactsTotal,
			stages: state.stages,
			createStage: state.createStage,
			updateStage: state.updateStage,
			deleteStage: state.deleteStage,
			moveStage: state.moveStage
		}))
	);
	const [formOpen, setFormOpen] = useState(false);
	const [editingStage, setEditingStage] = useState<RelationshipStage>();
	const [deletingStage, setDeletingStage] = useState<RelationshipStage>();
	const [movingStageId, setMovingStageId] = useState<string>();
	const [toast, setToast] = useState('');
	const previousCreateRequest = useRef(createRequest);
	const orderedStages = useMemo(() => [...stages].sort((first, second) => first.order - second.order), [stages]);
	const filteredStages = useMemo(() => {
		const normalizedSearch = normalizeText(search);
		return orderedStages.filter(stage =>
			normalizeText(`${stage.name} ${stage.description} ${stage.color}`).includes(normalizedSearch)
		);
	}, [orderedStages, search]);
	const actualLargestStage = orderedStages
		.map(stage => ({ stage, count: stage.contactCount }))
		.sort((first, second) => second.count - first.count)[0];

	useEffect(() => {
		if (createRequest !== previousCreateRequest.current) {
			previousCreateRequest.current = createRequest;
			setEditingStage(undefined);
			setFormOpen(true);
		}
	}, [createRequest]);

	useEffect(() => {
		if (!toast) return;
		const timeout = window.setTimeout(() => setToast(''), 2400);
		return () => window.clearTimeout(timeout);
	}, [toast]);

	const handleSave = async (draft: RelationshipStageDraft, stageId?: string) => {
		if (!uid) throw new Error('Área de trabalho não identificada.');

		if (stageId) {
			await updateStage(uid, stageId, draft);
			setToast('Etapa atualizada.');
		} else {
			await createStage(uid, draft);
			setToast('Nova etapa criada.');
		}

		setFormOpen(false);
		setEditingStage(undefined);
	};

	const handleMove = async (stageId: string, direction: 'up' | 'down') => {
		if (!uid) return;
		setMovingStageId(stageId);
		try {
			await moveStage(uid, stageId, direction);
			setToast('Ordem das etapas atualizada.');
		} catch (error) {
			setToast(error instanceof Error ? error.message : 'Não foi possível reordenar as etapas.');
		} finally {
			setMovingStageId(undefined);
		}
	};

	return (
		<div className="relative flex min-h-0 flex-col overflow-hidden bg-slate-50 dark:bg-[#0b151a]">
			<header className="shrink-0 px-3 pb-4 pt-4 mobile:px-5 mobile:pt-5">
				<div className="flex items-end justify-between gap-3">
					<div className="flex min-w-0 items-start gap-2 mobile:gap-3">
						<Button
							theme="ghost"
							type="button"
							className="icon-button -ml-2 mt-0.5"
							aria-label="Voltar para contatos"
							onClick={() => uid && navigate(`/w/${uid}/contacts`)}>
							<MdArrowBack aria-hidden="true" />
						</Button>
						<div>
							<p className="text-[9px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-500">
								Configuração
							</p>
							<h1 className="mt-1 text-xl font-bold tracking-[-.04em] mobile:text-2xl">
								Etapas de relacionamento
							</h1>
							<p className="mt-1 text-xs text-slate-500 dark:text-slate-400 mobile:text-[11px]">
								Crie fases personalizadas para organizar sua jornada de atendimento.
							</p>
						</div>
					</div>
					<Button
						type="button"
						className="h-9 min-h-9 shrink-0 px-3 text-xs"
						onClick={() => {
							setEditingStage(undefined);
							setFormOpen(true);
						}}>
						<MdAdd aria-hidden="true" />
						<span className="hidden mobile:inline">Nova etapa</span>
						<span className="mobile:hidden">Nova</span>
					</Button>
				</div>

				<div className="mt-4 grid grid-cols-3 gap-2">
					<div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-[#223138] dark:bg-[#0e181e]">
						<span className="text-[9px] font-semibold uppercase tracking-[.06em] text-slate-400">
							Etapas
						</span>
						<strong className="mt-1 block text-lg">{stages.length}</strong>
					</div>
					<div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-[#223138] dark:bg-[#0e181e]">
						<span className="text-[9px] font-semibold uppercase tracking-[.06em] text-slate-400">
							Contatos
						</span>
						<strong className="mt-1 block text-lg">{workspaceContactsTotal}</strong>
					</div>
					<div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 dark:border-[#223138] dark:bg-[#0e181e]">
						<span className="text-[9px] font-semibold uppercase tracking-[.06em] text-slate-400">
							Maior etapa
						</span>
						<strong className="mt-1 block truncate text-sm">
							{actualLargestStage?.stage.name || '—'} · {actualLargestStage?.count || 0}
						</strong>
					</div>
				</div>
			</header>

			<div className="grid min-h-0 flex-1 gap-3 px-3 pb-3 mobile:grid-cols-[minmax(0,1fr)_280px] mobile:px-5 mobile:pb-5">
				<section className="min-h-0 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-panel dark:border-[#223138] dark:bg-[#0e181e] mobile:p-4 scrollbar-thin">
					<div className="flex items-center justify-between gap-2 pb-3">
						<div>
							<h2 className="text-xs font-semibold">Suas etapas</h2>
							<p className="mt-1 text-[9px] text-slate-400">
								A ordem abaixo define a sequência da jornada.
							</p>
						</div>
						<span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] text-slate-500 dark:bg-[#17262e] dark:text-slate-300">
							{filteredStages.length} exibidas
						</span>
					</div>

					<div className="grid gap-2.5">
						{filteredStages.map(stage => {
							const contactCount = stage.contactCount;
							const actualIndex = orderedStages.findIndex(item => item.id === stage.id);

							return (
								<article
									key={stage.id}
									className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3.5 transition-colors hover:border-slate-300 hover:bg-white dark:border-[#223138] dark:bg-[#101c22] dark:hover:border-[#344851] dark:hover:bg-[#131f26]">
									<span
										className="absolute inset-y-0 left-0 w-1"
										style={{ backgroundColor: stage.color }}
									/>
									<div className="flex items-start gap-3 pl-1">
										<span
											className="grid size-10 shrink-0 place-items-center rounded-xl"
											style={{
												color: stage.color,
												backgroundColor: hexToRgba(stage.color, 0.12)
											}}>
											<StageIcon name={stage.icon} className="size-5" />
										</span>
										<div className="min-w-0 flex-1">
											<div className="flex flex-wrap items-center gap-2">
												<strong className="text-xs">{stage.name}</strong>
												<span
													className="rounded-md px-1.5 py-0.5 font-mono text-[8px]"
													style={{
														color: stage.color,
														backgroundColor: hexToRgba(stage.color, 0.12)
													}}>
													{stage.color}
												</span>
											</div>
											<p className="mt-1 line-clamp-2 text-xs leading-4 text-slate-500 dark:text-slate-400">
												{stage.description || 'Sem descrição.'}
											</p>
											<span className="mt-2 inline-flex items-center gap-1 text-[9px] text-slate-400">
												<MdOutlinePeopleAlt aria-hidden="true" /> {contactCount}{' '}
												{contactCount === 1 ? 'contato' : 'contatos'}
											</span>
										</div>
										<div className="flex shrink-0 items-center gap-0.5">
											<Button
												theme="ghost"
												type="button"
												className="size-8 min-h-8 rounded-lg p-0"
												aria-label={`Mover ${stage.name} para cima`}
												disabled={
													Boolean(search) || actualIndex === 0 || Boolean(movingStageId)
												}
												onClick={() => void handleMove(stage.id, 'up')}>
												<MdArrowUpward aria-hidden="true" />
											</Button>
											<Button
												theme="ghost"
												type="button"
												className="size-8 min-h-8 rounded-lg p-0"
												aria-label={`Mover ${stage.name} para baixo`}
												disabled={
													Boolean(search) ||
													actualIndex === orderedStages.length - 1 ||
													Boolean(movingStageId)
												}
												onClick={() => void handleMove(stage.id, 'down')}>
												<MdArrowDownward aria-hidden="true" />
											</Button>
											<Button
												theme="ghost"
												type="button"
												className="size-8 min-h-8 rounded-lg p-0"
												aria-label={`Editar ${stage.name}`}
												onClick={() => {
													setEditingStage(stage);
													setFormOpen(true);
												}}>
												<MdEdit aria-hidden="true" />
											</Button>
											<Button
												theme="ghost"
												type="button"
												className="size-8 min-h-8 rounded-lg p-0 hover:text-red-500"
												aria-label={`Excluir ${stage.name}`}
												disabled={stages.length <= 1 || Boolean(movingStageId)}
												onClick={() => setDeletingStage(stage)}>
												<MdDeleteOutline aria-hidden="true" />
											</Button>
										</div>
									</div>
								</article>
							);
						})}
					</div>
				</section>

				<aside className="hidden min-h-0 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-panel dark:border-[#223138] dark:bg-[#0e181e] mobile:block scrollbar-thin">
					<span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-[#0f3826] dark:text-brand-400">
						<MdRoute className="size-5" aria-hidden="true" />
					</span>
					<h2 className="mt-3 text-sm font-semibold">Prévia da jornada</h2>
					<p className="mt-1 text-xs leading-4 text-slate-500 dark:text-slate-400">
						Cada contato pode estar em uma etapa. Edite a ordem para adaptar o fluxo da sua equipe.
					</p>
					<div className="relative mt-5 grid gap-4 pl-1 before:absolute before:bottom-3 before:left-3 before:top-3 before:w-px before:bg-slate-200 dark:before:bg-[#223138]">
						{orderedStages.map(stage => (
							<div key={stage.id} className="relative flex gap-3">
								<span
									className="z-1 grid size-6 shrink-0 place-items-center rounded-full ring-4 ring-white dark:ring-[#0e181e]"
									style={{ color: stage.color, backgroundColor: hexToRgba(stage.color, 0.16) }}>
									<StageIcon name={stage.icon} className="size-3.5" />
								</span>
								<div className="min-w-0">
									<strong className="block truncate text-xs">{stage.name}</strong>
									<span className="text-[9px] text-slate-400">{stage.contactCount} contatos</span>
								</div>
							</div>
						))}
					</div>
				</aside>
			</div>

			{formOpen && (
				<StageFormModal
					stage={editingStage}
					existingStages={stages}
					onClose={() => {
						setFormOpen(false);
						setEditingStage(undefined);
					}}
					onSave={handleSave}
				/>
			)}
			{deletingStage && (
				<DeleteStageModal
					stage={deletingStage}
					stages={orderedStages}
					contactCount={deletingStage.contactCount}
					onClose={() => setDeletingStage(undefined)}
					onConfirm={async replacementStageId => {
						if (!uid) throw new Error('Área de trabalho não identificada.');
						await deleteStage(uid, deletingStage.id, replacementStageId);
						setDeletingStage(undefined);
						setToast('Etapa excluída e contatos realocados.');
					}}
				/>
			)}

			<div
				role="status"
				aria-live="polite"
				className={`pointer-events-none fixed bottom-20 left-1/2 z-60 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xl transition mobile:bottom-6 dark:bg-white dark:text-slate-900 ${toast ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
				{toast}
			</div>
		</div>
	);
};
