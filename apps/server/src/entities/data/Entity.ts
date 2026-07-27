import { prisma } from '@wppsync/database';
import { Terminal } from '@wppsync/shared';
import { CacheableMemory } from 'cacheable';
import { z } from 'zod';

import { MaybePromise } from '../types/index.js';

export interface EntityRaw {
	id?: string;
}

export class Entity<T extends Record<string, any>, TExtra = Record<string, any>, TEntities = Record<string, any>> {
	public db = prisma;

	public original: T & EntityRaw;

	public data: T & EntityRaw;
	public extra: TExtra;

	public entities: TEntities;

	public changes: Partial<T> = {};

	static cache = new CacheableMemory({ ttl: '30m', lruSize: 20, checkInterval: 60000, useClone: false });

	public dataHandler = {
		set: (target: T, prop: string, value: any) => {
			if (target[prop] !== value) {
				this.changes[prop as keyof T] = value;
			}

			return Reflect.set(target, prop, value);
		}
	};

	public exists: boolean;

	constructor(options: { data: T; extra?: TExtra; entities?: TEntities }) {
		const exists = !!options.data.id;
		const identifier = exists ? options.data.id : Math.random().toString();

		this.original = {
			...options.data,
			id: identifier
		};

		this.data = new Proxy(this.original, this.dataHandler);

		this.extra = options.extra || ({} as TExtra);

		this.entities = options.entities || ({} as TEntities);

		this.exists = exists;
	}

	get id() {
		return this.original.id!;
	}

	async getFromCache<T>(key: string, callback: () => MaybePromise<T>, options?: { duration?: number }): Promise<T> {
		if (!Entity.cache.has(key)) {
			Entity.cache.set(key, callback(), options?.duration || 600);
		}

		return Entity.cache.get(key) as T;
	}

	toRaw(...args: any[]) {
		return this.original;
	}

	async toObject(...args: any[]): Promise<any> {
		Terminal.error('ENTITY', `Method 'toObject' not implemented for entity '${this.constructor.name}'`);
	}

	addChange(key: keyof T, value: T[keyof T]) {
		this.data[key] = value;
	}

	addChanges(changes: Partial<T>) {
		for (const key in changes) {
			if (changes[key] === undefined) continue;
			this.data[key] = changes[key]!;
		}
	}

	async create() {
		Terminal.error('ENTITY', `Method 'create' not implemented for entity '${this.constructor.name}'`);
	}

	async update() {
		Terminal.error('ENTITY', `Method 'update' not implemented for entity '${this.constructor.name}'`);
	}

	async save() {
		if (this.exists) {
			await this.update();
		} else {
			await this.create();

			this.exists = true;
		}
	}

	async delete() {
		this.exists = false;
	}

	static async delete() {
		Terminal.error('ENTITY', `Method 'delete' not implemented for entity '${this.name}'`);
	}

	static toDTO() {
		Terminal.error('ENTITY', `Method 'toDTO' not implemented for entity '${this.name}'`);

		return z.object({});
	}

	static fromList(dataList: EntityRaw[]) {
		Terminal.error('ENTITY', `Method 'fromList' not implemented for entity '${this.name}'`);
	}
}
