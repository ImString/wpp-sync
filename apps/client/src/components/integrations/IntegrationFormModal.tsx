import { useEffect, useMemo, useState } from 'react';
import { MdClose, MdEdit, MdLink } from 'react-icons/md';

import { Button } from '@/components/buttons';

import { ChannelIcon } from './ChannelIcon';
import type { ChannelDefinition, Integration, IntegrationDraft } from './types';

interface IntegrationFormModalProps {
	channel: ChannelDefinition;
	integration?: Integration;
	onClose: () => void;
	onSave: (draft: IntegrationDraft, integrationId?: string) => void;
}

const fieldClassName =
	'h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white dark:border-[#223138] dark:bg-[#131f26] dark:focus:bg-[#0e181e]';

export const IntegrationFormModal: React.FC<IntegrationFormModalProps> = props => {
	const [name, setName] = useState(props.integration?.name || `${props.channel.name} Principal`);
	const [account, setAccount] = useState(props.integration?.account || '');
	const [submitted, setSubmitted] = useState(false);
	const isEditing = Boolean(props.integration);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') props.onClose();
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [props.onClose]);

	const accountError = useMemo(() => {
		if (!account.trim()) return `Informe ${props.channel.accountLabel.toLowerCase()}.`;
		// if (props.channel.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.trim()))
		// 	return 'Informe um e-mail válido.';
		if (props.channel.type === 'website' && !/^(https?:\/\/)?[\w.-]+\.[a-z]{2,}/i.test(account.trim()))
			return 'Informe um domínio válido.';
		return '';
	}, [account, props.channel.accountLabel, props.channel.type]);

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		setSubmitted(true);

		if (!name.trim() || accountError) return;

		props.onSave(
			{
				name: name.trim(),
				account: account.trim(),
				type: props.channel.type
			},
			props.integration?.id
		);
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-[3px] mobile:items-center mobile:p-5"
			role="presentation"
			onMouseDown={event => {
				if (event.target === event.currentTarget) props.onClose();
			}}>
			<section
				role="dialog"
				aria-modal="true"
				aria-labelledby="integration-form-title"
				className="integrations-modal w-full rounded-t-3xl border border-slate-200 bg-white shadow-2xl dark:border-[#223138] dark:bg-[#0e181e] mobile:max-w-125 mobile:rounded-[22px]">
				<header className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 dark:border-[#223138] mobile:px-5">
					<div className="flex items-start gap-3">
						<ChannelIcon type={props.channel.type} />
						<div>
							<h2 id="integration-form-title" className="text-base font-bold tracking-[-.02em]">
								{isEditing ? `Editar ${props.channel.name}` : `Conectar ${props.channel.name}`}
							</h2>
							<p className="mt-1 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
								{isEditing ? 'Atualize a identificação deste canal.' : props.channel.description}
							</p>
						</div>
					</div>
					<Button
						theme="ghost"
						type="button"
						className="icon-button"
						aria-label="Fechar"
						onClick={props.onClose}>
						<MdClose aria-hidden="true" />
					</Button>
				</header>

				<form onSubmit={handleSubmit} noValidate>
					<div className="grid gap-4 p-4 mobile:p-5">
						<label className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
							Nome da conexão <span className="text-red-500">*</span>
							<div className="relative mt-1.5">
								<MdEdit
									className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
									aria-hidden="true"
								/>
								<input
									autoFocus
									value={name}
									onChange={event => setName(event.target.value)}
									placeholder={`Ex.: ${props.channel.name} Comercial`}
									aria-invalid={submitted && !name.trim()}
									className={`${fieldClassName} pl-9`}
								/>
							</div>
							{submitted && !name.trim() && (
								<span className="mt-1 block text-[9px] text-red-500">
									Informe um nome para a conexão.
								</span>
							)}
						</label>

						<label className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
							{props.channel.accountLabel} <span className="text-red-500">*</span>
							<div className="relative mt-1.5">
								<MdLink
									className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
									aria-hidden="true"
								/>
								<input
									value={account}
									onChange={event => setAccount(event.target.value)}
									placeholder={props.channel.accountPlaceholder}
									aria-invalid={submitted && Boolean(accountError)}
									className={`${fieldClassName} pl-9`}
								/>
							</div>
							{submitted && accountError && (
								<span className="mt-1 block text-[9px] text-red-500">{accountError}</span>
							)}
						</label>

						<div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[9px] leading-4 text-slate-500 dark:border-[#223138] dark:bg-[#131f26] dark:text-slate-400">
							Ao continuar, o WppSync solicitará somente as permissões necessárias para receber e
							responder mensagens deste canal.
						</div>
					</div>

					<footer className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3.5 dark:border-[#223138] mobile:px-5">
						<Button theme="secondary" type="button" className="min-w-24" onClick={props.onClose}>
							Cancelar
						</Button>
						<Button type="submit" className="min-w-28">
							{isEditing ? 'Salvar' : 'Continuar'}
						</Button>
					</footer>
				</form>
			</section>
		</div>
	);
};
