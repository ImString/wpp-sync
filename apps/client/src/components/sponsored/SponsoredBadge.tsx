export const SponsoredBadge: React.FC = () => (
	<a
		aria-label="Visitar o site da FantasyHost"
		className="group fixed right-4 bottom-4 z-1000 flex h-12 max-w-[calc(100vw-2rem)] items-center overflow-hidden rounded-full bg-[linear-gradient(135deg,#050505_0%,#151515_55%,#292929_100%)] text-sm font-semibold whitespace-nowrap text-white shadow-[0_10px_30px_rgba(0,0,0,0.38)] ring-1 ring-white/10 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:bg-[linear-gradient(135deg,#101010_0%,#202020_55%,#343434_100%)] hover:shadow-[0_14px_34px_rgba(0,0,0,0.48)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-600 motion-reduce:transform-none"
		href="https://fantasyhost.com.br"
		rel="noopener noreferrer"
		target="_blank">
		<span className="grid size-12 shrink-0 place-items-center">
			<img alt="" aria-hidden="true" className="h-5 w-auto" src="/fantasyhost-logo.png" />
		</span>
		<span className="max-w-0 overflow-hidden opacity-0 transition-[max-width,margin,opacity] duration-300 ease-out group-hover:mr-4 group-hover:max-w-56 group-hover:opacity-100 group-focus-visible:mr-4 group-focus-visible:max-w-56 group-focus-visible:opacity-100 motion-reduce:transition-none">
			Patrocinado por FantasyHost
		</span>
	</a>
);
