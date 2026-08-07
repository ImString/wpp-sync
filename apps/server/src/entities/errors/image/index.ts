import type { InvalidImageError } from './InvalidImageError.js';
import type { UnsupportedImageError } from './UnsupportedImageError.js';

export * from './ImageErrorCode.js';
export * from './InvalidImageError.js';
export * from './UnsupportedImageError.js';

export type ImageError = InvalidImageError | UnsupportedImageError;
