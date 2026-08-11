export const SponsoredBadge: React.FC = () => (
	<a
		aria-label="Visitar o site da FantasyHost"
		className="fixed bottom-4 right-4 z-1000 flex max-w-[calc(100vw-2rem)] items-center gap-2.5 rounded-full bg-[linear-gradient(135deg,#050505_0%,#151515_55%,#292929_100%)] px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap text-white shadow-[0_10px_30px_rgba(0,0,0,0.38)] ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-[linear-gradient(135deg,#101010_0%,#202020_55%,#343434_100%)] hover:shadow-[0_14px_34px_rgba(0,0,0,0.48)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-600 motion-reduce:transform-none"
		href="https://fantasyhost.com.br"
		rel="noopener noreferrer"
		target="_blank">
		<img alt="" aria-hidden="true" className="h-5 w-auto shrink-0" src="/fantasyhost-logo.png" />
		<span className="truncate">Patrocinado por FantasyHost</span>
	</a>
);
