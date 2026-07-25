export const ConnectionStatus: React.FC = () => {
	return (
		<span className="hidden h-9 items-center gap-2 rounded-full bg-slate-100 px-3 text-[11px] font-semibold text-slate-500 mobile:inline-flex dark:bg-[#131f26] dark:text-slate-300">
			<span className="size-2 rounded-full bg-brand-500 shadow-[0_0_0_4px_rgba(37,211,102,.13)]" />
			Conectado
		</span>
	);
};
