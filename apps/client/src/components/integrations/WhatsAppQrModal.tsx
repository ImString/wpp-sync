import { useEffect, useMemo, useState } from 'react';
import { MdClose, MdExpandMore, MdInfoOutline, MdPhoneAndroid, MdRefresh } from 'react-icons/md';
import { twMerge } from 'tailwind-merge';

import { Button } from '@/components/buttons';

import { ChannelIcon } from './ChannelIcon';
import { QrCode } from './QrCode';
import type { Integration } from './types';

interface WhatsAppQrModalProps {
	integration: Integration;
	onClose: () => void;
	onRefresh: () => void;
}

const formatSeconds = (seconds: number) => `00:${seconds.toString().padStart(2, '0')}`;

export const WhatsAppQrModal: React.FC<WhatsAppQrModalProps> = props => {
	const [mode, setMode] = useState<'qr' | 'code'>('qr');
	const [instructionsOpen, setInstructionsOpen] = useState(false);
	const [seconds, setSeconds] = useState(59);
	const [seed, setSeed] = useState(() => Date.now() % 997);
	const pairingCode = useMemo(() => {
		const digits = String(10000000 + ((seed * 7919) % 89999999));
		return `${digits.slice(0, 4)} ${digits.slice(4, 8)}`;
	}, [seed]);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') props.onClose();
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [props.onClose]);

	useEffect(() => {
		if (seconds <= 0) return;

		const interval = window.setInterval(() => setSeconds(value => Math.max(0, value - 1)), 1000);
		return () => window.clearInterval(interval);
	}, [seconds]);

	const refreshCode = () => {
		setSeed(value => value + 1);
		setSeconds(59);
		props.onRefresh();
	};

	return (
		<div
			className="fixed inset-0 z-55 flex items-end justify-center bg-slate-950/65 p-0 backdrop-blur-[3px] mobile:items-center mobile:p-5"
			role="presentation"
			onMouseDown={event => {
				if (event.target === event.currentTarget) props.onClose();
			}}>
			<section
				role="dialog"
				aria-modal="true"
				aria-labelledby="whatsapp-qr-title"
				className="integrations-modal max-h-[96dvh] w-full overflow-y-auto rounded-t-3xl border border-slate-200 bg-white shadow-2xl dark:border-[#223138] dark:bg-[#0e181e] mobile:max-w-130 mobile:rounded-[22px] scrollbar-thin">
				<header className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 dark:border-[#223138] mobile:px-5">
					<div className="flex min-w-0 items-start gap-3">
						<ChannelIcon type="whatsapp" />
						<div className="min-w-0">
							<p className="text-[9px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
								Conexão segura
							</p>
							<h2
								id="whatsapp-qr-title"
								className="mt-0.5 truncate text-base font-bold tracking-[-.02em]">
								Conecte “{props.integration.name}”
							</h2>
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

				<div className="p-4 mobile:p-5">
					<div
						className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-[#131f26]"
						role="tablist"
						aria-label="Forma de conexão">
						<button
							type="button"
							role="tab"
							aria-selected={mode === 'qr'}
							className={twMerge(
								'rounded-lg px-3 py-2 text-[10px] font-semibold text-slate-500 transition dark:text-slate-400',
								mode === 'qr' && 'bg-white text-slate-900 shadow-sm dark:bg-[#0e181e] dark:text-white'
							)}
							onClick={() => setMode('qr')}>
							Conectar com QR Code
						</button>
						<button
							type="button"
							role="tab"
							aria-selected={mode === 'code'}
							className={twMerge(
								'rounded-lg px-3 py-2 text-[10px] font-semibold text-slate-500 transition dark:text-slate-400',
								mode === 'code' && 'bg-white text-slate-900 shadow-sm dark:bg-[#0e181e] dark:text-white'
							)}
							onClick={() => setMode('code')}>
							Usar código
						</button>
					</div>

					<p className="mt-4 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
						{mode === 'qr'
							? 'Abra o WhatsApp no celular e escaneie o QR Code para começar a sincronizar suas conversas.'
							: 'No WhatsApp, escolha conectar com número de telefone e informe o código abaixo.'}
					</p>

					<button
						type="button"
						aria-expanded={instructionsOpen}
						className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-slate-600 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-400"
						onClick={() => setInstructionsOpen(value => !value)}>
						<MdExpandMore
							className={twMerge('transition', instructionsOpen && 'rotate-180')}
							aria-hidden="true"
						/>
						Como conectar
					</button>
					{instructionsOpen && (
						<ol className="mt-2 grid gap-1.5 rounded-xl bg-slate-50 p-3 text-[9px] leading-4 text-slate-500 dark:bg-[#131f26] dark:text-slate-400">
							<li>1. No WhatsApp, abra Configurações ou Menu.</li>
							<li>2. Toque em Aparelhos conectados e depois em Conectar aparelho.</li>
							<li>3. Escaneie o QR Code desta tela ou use o código de pareamento.</li>
						</ol>
					)}

					<div className="mt-4 grid min-h-69.5 place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 dark:border-[#2b3d45] dark:bg-[#0b151a]">
						{mode === 'qr' ? (
							<div className="text-center">
								{seconds > 0 ? (
									<QrCode seed={seed} className="mx-auto size-55 max-w-full rounded-2xl shadow-sm" />
								) : (
									<div className="grid size-55 max-w-full place-items-center rounded-2xl bg-white p-6 shadow-sm dark:bg-[#101c22]">
										<div>
											<MdRefresh className="mx-auto size-8 text-slate-400" aria-hidden="true" />
											<p className="mt-2 text-xs font-semibold">QR Code expirado</p>
											<p className="mt-1 text-[9px] text-slate-500">
												Gere um novo código para continuar.
											</p>
										</div>
									</div>
								)}
								<p className="mt-3 text-[9px] font-medium text-slate-500 dark:text-slate-400">
									{seconds > 0
										? `Este código expira em ${formatSeconds(seconds)}`
										: 'O código não está mais válido'}
								</p>
							</div>
						) : (
							<div className="w-full max-w-[320px] text-center">
								<span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-50 text-xl text-brand-700 dark:bg-[#0f3826] dark:text-brand-400">
									<MdPhoneAndroid aria-hidden="true" />
								</span>
								<p className="mt-4 text-[9px] font-bold uppercase tracking-[.12em] text-slate-400">
									Código de pareamento
								</p>
								<strong className="mt-2 block font-mono text-3xl tracking-[.18em] text-slate-900 dark:text-white">
									{pairingCode}
								</strong>
								<p className="mt-3 text-[9px] leading-4 text-slate-500 dark:text-slate-400">
									Digite este código no WhatsApp. Não compartilhe com outras pessoas.
								</p>
							</div>
						)}
					</div>

					<div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[9px] leading-4 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
						<MdInfoOutline className="mt-0.5 shrink-0 text-sm" aria-hidden="true" />
						<span>
							O QR Code definitivo será fornecido pela sessão do WhatsApp no servidor; nesta interface ele
							representa o fluxo de conexão.
						</span>
					</div>
				</div>

				<footer className="flex items-center justify-between gap-2 border-t border-slate-200 px-4 py-3.5 dark:border-[#223138] mobile:px-5">
					<span className="flex items-center gap-2 text-[9px] font-medium text-slate-500 dark:text-slate-400">
						<span className="relative size-2 rounded-full bg-amber-400 before:absolute before:inset-0 before:animate-ping before:rounded-full before:bg-amber-400/50" />
						Aguardando conexão
					</span>
					<div className="flex items-center gap-2">
						<Button
							theme="secondary"
							type="button"
							className="min-w-20 px-3 text-xs"
							onClick={props.onClose}>
							Fechar
						</Button>
						<Button type="button" className="min-w-24 px-3 text-xs" onClick={refreshCode}>
							<MdRefresh aria-hidden="true" />
							Gerar novo
						</Button>
					</div>
				</footer>
			</section>
		</div>
	);
};
