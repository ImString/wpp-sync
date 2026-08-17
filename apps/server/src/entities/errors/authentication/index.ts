import type { CurrentPasswordIncorrectError } from './CurrentPasswordIncorrectError.js';
import type { ExpiredGoogleAuthStateError } from './ExpiredGoogleAuthStateError.js';
import type { GoogleAuthCredentialsRequiredError } from './GoogleAuthCredentialsRequiredError.js';
import type { GoogleEmailNotVerifiedError } from './GoogleEmailNotVerifiedError.js';
import type { GoogleIdTokenMissingError } from './GoogleIdTokenMissingError.js';
import type { GoogleIntegrationUserNotFoundError } from './GoogleIntegrationUserNotFoundError.js';
import type { InvalidCredentialsError } from './InvalidCredentialsError.js';
import type { InvalidGoogleIdTokenPayloadError } from './InvalidGoogleIdTokenPayloadError.js';
import type { InvalidTokenError } from './InvalidTokenError.js';
import type { SocialLoginRequiredError } from './SocialLoginRequiredError.js';

export * from './AuthenticationErrorCode.js';
export * from './CurrentPasswordIncorrectError.js';
export * from './ExpiredGoogleAuthStateError.js';
export * from './GoogleAuthCredentialsRequiredError.js';
export * from './GoogleEmailNotVerifiedError.js';
export * from './GoogleIdTokenMissingError.js';
export * from './GoogleIntegrationUserNotFoundError.js';
export * from './InvalidGoogleIdTokenPayloadError.js';
export * from './InvalidCredentialsError.js';
export * from './InvalidTokenError.js';
export * from './SocialLoginRequiredError.js';

export type AuthenticationError =
	| CurrentPasswordIncorrectError
	| ExpiredGoogleAuthStateError
	| GoogleAuthCredentialsRequiredError
	| GoogleEmailNotVerifiedError
	| GoogleIdTokenMissingError
	| GoogleIntegrationUserNotFoundError
	| InvalidCredentialsError
	| InvalidGoogleIdTokenPayloadError
	| InvalidTokenError
	| SocialLoginRequiredError;
