import { useMemo, useState } from 'react';
import { MdChatBubbleOutline, MdCheck, MdChevronRight, MdClose, MdCode, MdContentCopy } from 'react-icons/md';
import { twMerge } from 'tailwind-merge';

import { Button } from '@/components/buttons';

type InstallationType = 'embed' | 'bubble';

interface SiteInstallationCodesProps {
	workspaceUid: string;
	integrationId: string;
	headerName: string;
}

const escapeHTMLAttribute = (value: string) =>
	value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const copyText = async (value: string) => {
	if (navigator.clipboard?.writeText) {
		await navigator.clipboard.writeText(value);
		return;
	}

	const textarea = document.createElement('textarea');
	textarea.value = value;
	textarea.style.position = 'fixed';
	textarea.style.opacity = '0';
	document.body.append(textarea);
	textarea.select();
	document.execCommand('copy');
	textarea.remove();
};

export const SiteInstallationCodes: React.FC<SiteInstallationCodesProps> = props => {
	const [selectedType, setSelectedType] = useState<InstallationType>();
	const [copiedType, setCopiedType] = useState<InstallationType>();

	const snippets = useMemo(() => {
		const baseURL = window.location.origin;
		const widgetURL = new URL('/widget', baseURL);
		widgetURL.searchParams.set('workspaceUid', props.workspaceUid);
		widgetURL.searchParams.set('integrationId', props.integrationId);
		widgetURL.searchParams.set('mode', 'embed');
		widgetURL.searchParams.set('title', props.headerName || 'Atendimento');
		widgetURL.searchParams.set('theme', 'auto');

		const iframeTitle = escapeHTMLAttribute(`Chat com ${props.headerName || 'Atendimento'}`);
		const embed = `<iframe
  src="${widgetURL.toString()}"
  title="${iframeTitle}"
  style="width: 100%; height: 100%; min-height: 700px; border: 0; border-radius: 20px"
  loading="lazy"
  allow="clipboard-write"
></iframe>`;

		const widgetConfig = JSON.stringify(
			{
				baseUrl: baseURL,
				workspaceUid: props.workspaceUid,
				integrationId: props.integrationId,
				title: props.headerName || 'Atendimento',
				position: 'right',
				theme: 'auto'
			},
			null,
			2
		).replace(/</g, '\\u003c');
		const bubble = `<script>
  window.wppSyncConfig = ${widgetConfig};
</script>
<script defer type="module" src="${baseURL}/widget.js"></script>`;

		return { embed, bubble };
	}, [props.headerName, props.integrationId, props.workspaceUid]);

	const selectedSnippet = selectedType ? snippets[selectedType] : undefined;

	const handleCopy = async () => {
		if (!selectedType || !selectedSnippet) return;

		await copyText(selectedSnippet);
		setCopiedType(selectedType);
		window.setTimeout(() => setCopiedType(current => (current === selectedType ? undefined : current)), 1800);
	};

	const options: Array<{
		type: InstallationType;
		label: string;
		description: string;
		icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
		iconClassName: string;
	}> = [
		{
			type: 'embed',
			label: 'Código Incorporável',
			description: 'Chat integrado ao conteúdo da página.',
			icon: MdCode,
			iconClassName: 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300'
		},
		{
			type: 'bubble',
			label: 'Código do Balão',
			description: 'Atalho flutuante no canto do site.',
			icon: MdChatBubbleOutline,
			iconClassName: 'bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300'
		}
	];

	return (
		<section
			aria-labelledby="site-installation-title"
			className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-[#223138] dark:bg-[#101b21]">
			<div className="flex items-start justify-between gap-3 px-4 py-3.5">
				<div>
					<h3
						id="site-installation-title"
						className="text-xs font-semibold text-slate-900 dark:text-slate-100">
						Códigos de instalação
					</h3>
					<p className="mt-1 text-xs leading-4 text-slate-500 dark:text-slate-400">
						Escolha como o chat será adicionado ao seu site.
					</p>
				</div>
				<span className="shrink-0 rounded-full bg-emerald-100 px-2 py-1 text-[8px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
					Conectado
				</span>
			</div>

			<div className="grid divide-y divide-slate-200 border-t border-slate-200 bg-slate-50/70 dark:divide-[#223138] dark:border-[#223138] dark:bg-[#0e181e] mobile:grid-cols-2 mobile:divide-x mobile:divide-y-0">
				{options.map(option => {
					const selected = selectedType === option.type;
					const Icon = option.icon;

					return (
						<button
							key={option.type}
							type="button"
							aria-expanded={selected}
							aria-controls="site-installation-code"
							className={twMerge(
								'group cursor-pointer flex min-w-0 items-center gap-3 px-4 py-3.5 text-left outline-none transition hover:bg-white focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500 dark:hover:bg-[#131f26] dark:focus-visible:bg-[#131f26]',
								selected && 'bg-brand-50/70 dark:bg-brand-500/5'
							)}
							onClick={() => {
								setSelectedType(current => (current === option.type ? undefined : option.type));
								setCopiedType(undefined);
							}}>
							<span
								className={twMerge(
									'grid size-9 shrink-0 place-items-center rounded-full',
									option.iconClassName
								)}>
								<Icon className="size-5" aria-hidden={true} />
							</span>
							<span className="min-w-0 flex-1">
								<strong className="block text-xs font-semibold text-slate-900 dark:text-slate-100">
									{option.label}
								</strong>
								<span className="mt-0.5 block text-[10px] leading-4 text-slate-500 dark:text-slate-400">
									{option.description}
								</span>
							</span>
							<MdChevronRight
								className={twMerge(
									'size-5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600 dark:text-slate-600 dark:group-hover:text-brand-400',
									selected && 'rotate-90 text-brand-600 dark:text-brand-400'
								)}
								aria-hidden="true"
							/>
						</button>
					);
				})}
			</div>

			{selectedType && selectedSnippet && (
				<div
					id="site-installation-code"
					className="border-t border-slate-200 bg-white p-3 dark:border-[#223138] dark:bg-[#101b21]">
					<div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
						<span className="min-w-36 flex-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
							{selectedType === 'embed'
								? 'Cole onde o chat será exibido'
								: 'Cole antes de fechar a tag </body>'}
						</span>
						<div className="flex shrink-0 items-center gap-1">
							<Button
								theme="ghost"
								type="button"
								className="h-8 min-h-8 px-2.5 text-[10px]"
								onClick={handleCopy}>
								{copiedType === selectedType ? (
									<>
										<MdCheck aria-hidden="true" /> Copiado
									</>
								) : (
									<>
										<MdContentCopy aria-hidden="true" /> Copiar código
									</>
								)}
							</Button>
							<Button
								theme="ghost"
								type="button"
								className="h-8 min-h-8 px-2.5 text-[10px]"
								onClick={() => {
									setSelectedType(undefined);
									setCopiedType(undefined);
								}}>
								<MdClose aria-hidden="true" /> Fechar
							</Button>
						</div>
					</div>
					<pre className="max-h-48 overflow-auto rounded-xl border border-slate-200 bg-slate-950 p-3 text-[10px] leading-4 text-slate-200 dark:border-[#223138] scrollbar-thin">
						<code>{selectedSnippet}</code>
					</pre>
				</div>
			)}
		</section>
	);
};
