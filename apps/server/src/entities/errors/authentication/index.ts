import type { InvalidCredentialsError } from './InvalidCredentialsError.js';
import type { InvalidTokenError } from './InvalidTokenError.js';
import type { SocialLoginRequiredError } from './SocialLoginRequiredError.js';

export * from './AuthenticationErrorCode.js';
export * from './InvalidCredentialsError.js';
export * from './InvalidTokenError.js';
export * from './SocialLoginRequiredError.js';

export type AuthenticationError = InvalidCredentialsError | InvalidTokenError | SocialLoginRequiredError;
