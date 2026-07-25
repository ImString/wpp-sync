export const ContactNotes: React.FC = () => {
	return (
		<section className="border-b border-slate-200 p-4.5 dark:border-[#223138]">
			<h3 className="text-xs font-semibold">Notas</h3>
			<textarea
				rows={4}
				placeholder="Adicionar uma nota..."
				aria-label="Notas do contato"
				className="mt-3 w-full resize-y rounded-xl border border-slate-200 bg-slate-100 p-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white dark:border-[#223138] dark:bg-[#131f26] dark:focus:bg-[#0e181e]"
			/>
		</section>
	);
};
