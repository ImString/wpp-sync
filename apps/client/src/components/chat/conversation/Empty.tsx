export const ConversationEmpty: React.FC = () => {
	return (
		<div className="grid flex-1 place-content-center justify-items-center gap-1.5 px-5 text-center text-sm text-slate-500 dark:text-slate-400">
			<strong className="text-slate-900 dark:text-slate-100">Nenhuma conversa encontrada</strong>
			<span>Tente usar outro termo ou filtro.</span>
		</div>
	);
};
