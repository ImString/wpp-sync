import 'reflect-metadata';

export type MetadataKey = string | symbol;

export function getOwnMetadata<T>(metadataKey: MetadataKey, target: object): T | undefined {
	return Reflect.getOwnMetadata(metadataKey, target) as T | undefined;
}

export function defineMetadata<T>(metadataKey: MetadataKey, value: T, target: object): void {
	Reflect.defineMetadata(metadataKey, value, target);
}
