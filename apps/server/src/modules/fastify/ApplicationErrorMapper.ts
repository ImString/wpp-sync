import { HttpResponse } from '@/modules/router/index.js';

import { ApplicationError, type ApplicationErrorCode } from '@/entities/errors/index.js';

const APPLICATION_ERROR_STATUS = {
	INVALID_TOKEN: 401,
	USER_EMAIL_ALREADY_EXISTS: 400,
	USER_NOT_FOUND: 404,
	USER_NO_PASSWORD_USE_SOCIAL_LOGIN: 400,
	USER_OR_PASSWORD_INCORRECT: 401,
	WORKSPACE_NOT_FOUND: 404,
	MEMBER_NOT_FOUND: 404,
	INVITE_NOT_FOUND: 404,
	INVITE_SAME_EMAIL: 409,
	INVITE_BELONGS_ANOTHER: 400,
	PERMISSION_DENIED: 403
} satisfies Record<ApplicationErrorCode, number>;

export function mapApplicationError(error: ApplicationError): HttpResponse {
	return HttpResponse.error(APPLICATION_ERROR_STATUS[error.code], error.code, {
		message: error.message,
		...error.data
	});
}
