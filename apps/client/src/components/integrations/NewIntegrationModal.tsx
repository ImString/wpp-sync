import { useEffect } from 'react';
import { MdChevronRight, MdClose, MdHub, MdSchedule } from 'react-icons/md';

import { Button } from '@/components/buttons';

import { ChannelIcon } from './ChannelIcon';
import { channels } from './data';
import type { ChannelDefinition } from './types';

interface NewIntegrationModalProps {
	onClose: () => void;
	onSelect: (channel: ChannelDefinition) => void;
}

export const NewIntegrationModal: React.FC<NewIntegrationModalProps> = props => {
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') props.onClose();
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [props.onClose]);

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
				aria-labelledby="new-integration-title"
				className="integrations-modal max-h-[94dvh] w-full overflow-y-auto rounded-t-3xl border border-slate-200 bg-white shadow-2xl dark:border-[#223138] dark:bg-[#0e181e] mobile:max-w-140 mobile:rounded-[22px] scrollbar-thin">
				<header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur dark:border-[#223138] dark:bg-[#0e181e]/95 mobile:px-5">
					<div className="flex items-start gap-3">
						<span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-lg text-brand-700 dark:bg-[#0f3826] dark:text-brand-400">
							<MdHub aria-hidden="true" />
						</span>
						<div>
							<h2 id="new-integration-title" className="text-base font-bold tracking-[-.02em]">
								Nova integração
							</h2>
							<p className="mt-1 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
								Escolha um canal para conectar ao atendimento da sua equipe.
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

				<div className="p-3 mobile:p-4">
					<p className="px-2 pb-2 pt-1 text-[9px] font-bold uppercase tracking-widest text-slate-400">
						Canais disponíveis
					</p>
					<div className="grid gap-1.5">
						{channels.map(channel => (
							<button
								key={channel.type}
								type="button"
								disabled={channel.disabled}
								className="group flex w-full items-center gap-3 rounded-2xl border border-transparent p-3 text-left transition hover:border-slate-200 hover:bg-slate-50 focus-visible:border-brand-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:hover:border-[#2d414a] dark:hover:bg-[#131f26]"
								onClick={() => props.onSelect(channel)}>
								<ChannelIcon type={channel.type} />
								<span className="min-w-0 flex-1">
									<strong className="block text-xs font-semibold text-slate-900 dark:text-white">
										{channel.name}
									</strong>
									<span className="mt-0.5 block text-[10px] leading-4 text-slate-500 dark:text-slate-400">
										{channel.description}
									</span>
								</span>
								{channel.disabled ? (
									<span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[8px] font-bold uppercase tracking-wide text-slate-500 dark:bg-[#17262e] dark:text-slate-400">
										<MdSchedule aria-hidden="true" /> Em breve
									</span>
								) : (
									<MdChevronRight
										className="size-5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600 dark:text-slate-600"
										aria-hidden="true"
									/>
								)}
							</button>
						))}
					</div>
				</div>
			</section>
		</div>
	);
};
