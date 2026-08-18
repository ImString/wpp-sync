import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { authAPI } from '@/utils/api';

import { useInterfaceStore } from '@/components/interface';

type TurnstileAction = 'login' | 'register';
type TurnstileStatus = 'loading' | 'waiting' | 'verified' | 'error';

interface TurnstileRenderOptions {
	sitekey: string;
	action: TurnstileAction;
	theme: 'light' | 'dark';
	size: 'flexible';
	language: 'pt-br';
	callback: (token: string) => void;
	'error-callback': () => void;
	'expired-callback': () => void;
	'timeout-callback': () => void;
}

interface TurnstileApi {
	render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
	reset: (widgetId: string) => void;
	remove: (widgetId: string) => void;
}

declare global {
	interface Window {
		turnstile?: TurnstileApi;
	}
}

interface AuthTurnstileProps {
	action: TurnstileAction;
	onTokenChange: (token: string | null) => void;
}

export interface AuthTurnstileHandle {
	reset: () => void;
}

const TURNSTILE_SCRIPT_ID = 'cloudflare-turnstile-script';
const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let turnstileScriptPromise: Promise<void> | null = null;

const loadTurnstileScript = (): Promise<void> => {
	if (window.turnstile) return Promise.resolve();
	if (turnstileScriptPromise) return turnstileScriptPromise;

	turnstileScriptPromise = new Promise<void>((resolve, reject) => {
		const staleScript = document.getElementById(TURNSTILE_SCRIPT_ID);
		staleScript?.remove();

		const script = document.createElement('script');
		script.id = TURNSTILE_SCRIPT_ID;
		script.src = TURNSTILE_SCRIPT_URL;
		script.async = true;
		script.defer = true;
		script.addEventListener('load', () => {
			if (!window.turnstile) {
				reject(new Error('Turnstile API was not initialized.'));
				return;
			}

			resolve();
		});
		script.addEventListener('error', () => reject(new Error('Turnstile script could not be loaded.')));
		document.head.appendChild(script);
	}).catch(error => {
		turnstileScriptPromise = null;
		throw error;
	});

	return turnstileScriptPromise;
};

export const AuthTurnstile = forwardRef<AuthTurnstileHandle, AuthTurnstileProps>((props, ref) => {
	const theme = useInterfaceStore(state => state.theme);
	const containerRef = useRef<HTMLDivElement>(null);
	const widgetIdRef = useRef<string | null>(null);
	const onTokenChangeRef = useRef(props.onTokenChange);
	const [siteKey, setSiteKey] = useState('');
	const [status, setStatus] = useState<TurnstileStatus>('loading');
	const [errorMessage, setErrorMessage] = useState('');
	const [retryAttempt, setRetryAttempt] = useState(0);

	useEffect(() => {
		onTokenChangeRef.current = props.onTokenChange;
	}, [props.onTokenChange]);

	useEffect(() => {
		let active = true;

		setStatus('loading');
		setErrorMessage('');

		void authAPI
			.getTurnstileConfiguration()
			.then(response => {
				if (!active) return;

				if (!response.success || !response.data?.siteKey) {
					throw new Error('Turnstile configuration is unavailable.');
				}

				setSiteKey(response.data.siteKey);
			})
			.catch(() => {
				if (!active) return;
				setStatus('error');
				setErrorMessage('Não foi possível carregar a verificação de segurança.');
			});

		return () => {
			active = false;
		};
	}, [retryAttempt]);

	useEffect(() => {
		if (!siteKey || !containerRef.current) return;

		let active = true;
		const container = containerRef.current;

		setStatus('loading');
		setErrorMessage('');
		onTokenChangeRef.current(null);

		void loadTurnstileScript()
			.then(() => {
				if (!active || !window.turnstile) return;

				setStatus('waiting');
				widgetIdRef.current = window.turnstile.render(container, {
					sitekey: siteKey,
					action: props.action,
					theme,
					size: 'flexible',
					language: 'pt-br',
					callback: token => {
						if (!active) return;
						onTokenChangeRef.current(token);
						setStatus('verified');
					},
					'error-callback': () => {
						if (!active) return;
						onTokenChangeRef.current(null);
						setStatus('error');
						setErrorMessage('A verificação falhou. Tente novamente.');
					},
					'expired-callback': () => {
						if (!active) return;
						onTokenChangeRef.current(null);
						setStatus('loading');
						if (widgetIdRef.current) window.turnstile?.reset(widgetIdRef.current);
					},
					'timeout-callback': () => {
						if (!active) return;
						onTokenChangeRef.current(null);
						setStatus('waiting');
					}
				});
			})
			.catch(() => {
				if (!active) return;
				setStatus('error');
				setErrorMessage('Não foi possível abrir a verificação de segurança.');
			});

		return () => {
			active = false;
			onTokenChangeRef.current(null);

			if (widgetIdRef.current && window.turnstile) {
				window.turnstile.remove(widgetIdRef.current);
			}

			widgetIdRef.current = null;
			container.replaceChildren();
		};
	}, [props.action, siteKey, theme]);

	useImperativeHandle(ref, () => ({
		reset: () => {
			onTokenChangeRef.current(null);
			setStatus('waiting');

			if (widgetIdRef.current && window.turnstile) {
				window.turnstile.reset(widgetIdRef.current);
			}
		}
	}));

	const retry = () => {
		setSiteKey('');
		setRetryAttempt(attempt => attempt + 1);
	};

	return (
		<div className={`auth-turnstile is-${status}`}>
			<div ref={containerRef} className="auth-turnstile__widget" />

			<div className="auth-turnstile__status" role="status" aria-live="polite">
				{status === 'loading' && 'Carregando verificação de segurança...'}
				{status === 'waiting' && 'Conclua a verificação para continuar.'}
				{status === 'verified' && 'Verificação concluída.'}
				{status === 'error' && (
					<>
						<span>{errorMessage}</span>
						<button type="button" onClick={retry}>
							Tentar novamente
						</button>
					</>
				)}
			</div>
		</div>
	);
});

AuthTurnstile.displayName = 'AuthTurnstile';
