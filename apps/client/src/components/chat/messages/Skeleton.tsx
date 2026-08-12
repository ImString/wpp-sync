export const MessageListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
	<div
		className="flex w-full shrink-0 animate-pulse flex-col gap-3 motion-reduce:animate-none"
		role="status"
		aria-label="Carregando mensagens">
		{Array.from({ length: count }, (_, index) => {
			const isSent = index % 3 === 1;
			const width = index % 3 === 0 ? 'w-[62%]' : index % 3 === 1 ? 'w-[54%]' : 'w-[45%]';

			return (
				<div
					key={index}
					aria-hidden="true"
					className={`${width} ${isSent ? 'self-end rounded-tr' : 'self-start rounded-tl'} space-y-2 rounded-xl bg-slate-200/90 px-3 py-3 dark:bg-[#1b2a31]`}>
					<span className="block h-2.5 w-full rounded-full bg-slate-300/80 dark:bg-[#263841]" />
					<span className="block h-2.5 w-3/5 rounded-full bg-slate-300/60 dark:bg-[#223138]" />
					<span className="ml-auto block h-1.5 w-8 rounded-full bg-slate-300/70 dark:bg-[#263841]" />
				</div>
			);
		})}
	</div>
);
