import type { ApplicationErrorCode } from './ApplicationErrorCode.js';

export class ApplicationError<TCode extends ApplicationErrorCode = ApplicationErrorCode> extends Error {
	constructor(
		readonly code: TCode,
		message: string,
		readonly data: Record<string, unknown> = {}
	) {
		super(message);
		this.name = new.target.name;
	}
}
