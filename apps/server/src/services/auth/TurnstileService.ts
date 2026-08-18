import { Provider } from '@/core/index.js';

import {
	TurnstileConfigurationError,
	TurnstileUnavailableError,
	TurnstileVerificationError
} from '@/entities/errors/authentication/index.js';

export type TurnstileAction = 'login' | 'register';

interface TurnstileVerificationOptions {
	token: string;
	action: TurnstileAction;
	remoteIp?: string;
}

interface TurnstileSiteverifyResponse {
	success?: boolean;
	hostname?: string;
	action?: string;
}

@Provider()
export class TurnstileService {
	private readonly siteKey = process.env.TURNSTILE_KEY?.trim() || '';
	private readonly secret = process.env.TURNSTILE_SECRET?.trim() || '';
	private readonly allowedHostnames = this.getAllowedHostnames();

	getPublicConfiguration() {
		this.assertConfigured();

		return { siteKey: this.siteKey };
	}

	async verify(options: TurnstileVerificationOptions): Promise<void> {
		this.assertConfigured();

		const body = new URLSearchParams({
			secret: this.secret,
			response: options.token
		});

		if (options.remoteIp) body.set('remoteip', options.remoteIp);

		let response: Response;
		try {
			response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body,
				signal: AbortSignal.timeout(8_000)
			});
		} catch {
			throw new TurnstileUnavailableError();
		}

		if (!response.ok) throw new TurnstileUnavailableError();

		let result: TurnstileSiteverifyResponse;
		try {
			result = (await response.json()) as TurnstileSiteverifyResponse;
		} catch {
			throw new TurnstileUnavailableError();
		}

		const hostname =
			typeof result.hostname === 'string' ? result.hostname.trim().toLowerCase().replace(/\.$/, '') : '';
		const isValid =
			result.success === true && result.action === options.action && this.allowedHostnames.has(hostname);

		if (!isValid) throw new TurnstileVerificationError();
	}

	private assertConfigured(): void {
		if (!this.siteKey || !this.secret || this.allowedHostnames.size === 0) {
			throw new TurnstileConfigurationError();
		}
	}

	private getAllowedHostnames(): Set<string> {
		try {
			const clientUrl = new URL(process.env.CLIENT_FULL_URL || '');
			return new Set([clientUrl.hostname.trim().toLowerCase().replace(/\.$/, '')]);
		} catch {
			return new Set();
		}
	}
}
