import { ApplicationError } from '../ApplicationError.js';

export class TurnstileUnavailableError extends ApplicationError<'TURNSTILE_UNAVAILABLE'> {
	constructor() {
		super('TURNSTILE_UNAVAILABLE', 'A verificação de segurança está indisponível. Tente novamente.');
	}
}
