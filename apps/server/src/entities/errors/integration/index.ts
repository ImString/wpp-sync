import type { IntegrationNotFoundError } from './IntegrationNotFoundError.js';

export * from './IntegrationErrorCode.js';
export * from './IntegrationNotFoundError.js';

export type IntegrationError = IntegrationNotFoundError;
