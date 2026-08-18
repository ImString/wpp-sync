import { ApplicationError } from '../ApplicationError.js';

export class TurnstileConfigurationError extends ApplicationError<'TURNSTILE_CONFIGURATION_ERROR'> {
	constructor() {
		super('TURNSTILE_CONFIGURATION_ERROR', 'A verificação de segurança não está configurada corretamente.');
	}
}
