import 'reflect-metadata';

export interface RouterState extends Record<PropertyKey, unknown> {}

export * from './core/index.js';
export * from './modules/Base.js';
export * from './modules/fastify/index.js';
export * from './modules/router/index.js';
