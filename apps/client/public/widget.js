const existingWidget = window.WppSyncWidget;

if (!existingWidget?.initialized) {
	const config = window.wppSyncConfig ?? {};
	const scriptURL = new URL(import.meta.url);
	const baseURL = new URL(config.baseUrl || scriptURL.origin, scriptURL);
	const workspaceUid = String(config.workspaceUid || '').trim();
	const integrationId = String(config.integrationId || config.channelId || '').trim();

	if (!workspaceUid || !integrationId) {
		console.error('[WppSync Widget] Informe workspaceUid e integrationId em window.wppSyncConfig.');
	} else {
		const widgetURL = new URL('/widget', baseURL);
		widgetURL.searchParams.set('workspaceUid', workspaceUid);
		widgetURL.searchParams.set('integrationId', integrationId);
		widgetURL.searchParams.set('mode', 'bubble');

		if (config.title) widgetURL.searchParams.set('title', String(config.title));
		if (config.photo) widgetURL.searchParams.set('photo', String(config.photo));
		if (config.theme) widgetURL.searchParams.set('theme', String(config.theme));

		const host = document.createElement('div');
		host.id = 'wppsync-widget';
		host.className = config.position === 'left' ? 'wppsync-left' : 'wppsync-right';
		const shadowRoot = host.attachShadow({ mode: 'open' });

		const stylesheet = document.createElement('link');
		stylesheet.rel = 'stylesheet';
		stylesheet.href = config.cssLink || new URL('/widget.css', baseURL).toString();

		const panel = document.createElement('div');
		panel.className = 'wppsync-panel';
		panel.setAttribute('role', 'dialog');
		panel.setAttribute('aria-label', config.title ? `Chat com ${config.title}` : 'Chat de atendimento');
		panel.setAttribute('aria-hidden', 'true');

		const iframe = document.createElement('iframe');
		iframe.className = 'wppsync-frame';
		iframe.src = widgetURL.toString();
		iframe.title = config.title ? `Chat com ${config.title}` : 'Chat de atendimento';
		iframe.allow = 'clipboard-write';
		iframe.loading = 'eager';
		iframe.tabIndex = -1;

		const toggleButton = document.createElement('button');
		toggleButton.className = 'wppsync-toggle';
		toggleButton.type = 'button';
		toggleButton.setAttribute('aria-label', 'Abrir conversa');
		toggleButton.setAttribute('aria-expanded', 'false');
		toggleButton.innerHTML = `
			<svg class="wppsync-icon wppsync-icon-chat" viewBox="0 0 24 24" aria-hidden="true">
				<path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Zm0 14H5.17L4 17.17V4h16v12Z" />
				<path d="M7 7h10v2H7zm0 4h7v2H7z" />
			</svg>
			<svg class="wppsync-icon wppsync-icon-close" viewBox="0 0 24 24" aria-hidden="true">
				<path d="m18.3 5.71-1.41-1.42L12 9.17 7.11 4.29 5.7 5.71 10.59 10.6 5.7 15.49l1.41 1.42L12 12.02l4.89 4.89 1.41-1.42-4.89-4.89z" />
			</svg>
			<span class="wppsync-presence" aria-hidden="true"></span>
		`;

		panel.append(iframe);
		shadowRoot.append(stylesheet, panel, toggleButton);
		(document.body || document.documentElement).append(host);

		let isOpen = false;

		const setOpen = nextOpen => {
			isOpen = Boolean(nextOpen);
			host.classList.toggle('wppsync-open', isOpen);
			panel.setAttribute('aria-hidden', String(!isOpen));
			toggleButton.setAttribute('aria-expanded', String(isOpen));
			toggleButton.setAttribute('aria-label', isOpen ? 'Fechar conversa' : 'Abrir conversa');
			iframe.tabIndex = isOpen ? 0 : -1;
		};

		const handleMessage = event => {
			if (event.source !== iframe.contentWindow || event.origin !== baseURL.origin) return;
			if (event.data?.type === 'wppsync:widget-close') setOpen(false);
		};

		const handleKeyDown = event => {
			if (event.key === 'Escape' && isOpen) {
				setOpen(false);
				toggleButton.focus();
			}
		};

		toggleButton.addEventListener('click', () => setOpen(!isOpen));
		window.addEventListener('message', handleMessage);
		document.addEventListener('keydown', handleKeyDown);

		window.WppSyncWidget = {
			initialized: true,
			open: () => setOpen(true),
			close: () => setOpen(false),
			toggle: () => setOpen(!isOpen),
			destroy: () => {
				window.removeEventListener('message', handleMessage);
				document.removeEventListener('keydown', handleKeyDown);
				host.remove();
				delete window.WppSyncWidget;
			}
		};
	}
}
