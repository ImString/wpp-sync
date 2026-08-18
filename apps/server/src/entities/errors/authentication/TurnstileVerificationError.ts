import { ApplicationError } from '../ApplicationError.js';

export class TurnstileVerificationError extends ApplicationError<'TURNSTILE_VERIFICATION_FAILED'> {
	constructor() {
		super(
			'TURNSTILE_VERIFICATION_FAILED',
			'Não foi possível confirmar a verificação de segurança. Tente novamente.'
		);
	}
}
