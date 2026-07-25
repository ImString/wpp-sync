export const ContactInformation: React.FC = () => {
	return (
		<section className="border-b border-slate-200 p-4.5 dark:border-[#223138]">
			<h3 className="text-xs font-semibold">Informações</h3>
			<dl className="mt-3.5 grid gap-3 text-[11px]">
				<div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2.5">
					<dt className="text-slate-500 dark:text-slate-400">Primeiro contato</dt>
					<dd>15/05/2025</dd>
				</div>
				<div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2.5">
					<dt className="text-slate-500 dark:text-slate-400">Última interação</dt>
					<dd>Hoje às 11:42</dd>
				</div>
				<div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2.5">
					<dt className="text-slate-500 dark:text-slate-400">Conversas</dt>
					<dd>7</dd>
				</div>
				<div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2.5">
					<dt className="text-slate-500 dark:text-slate-400">Origem</dt>
					<dd>Instagram</dd>
				</div>
			</dl>
		</section>
	);
};
