import { Entity } from './Entity.js';

export class EntityGroup<T extends Entity<any>> {
	items: T[];

	constructor(items: T[]) {
		this.items = items;
	}

	toRaw(...args: Parameters<T['toRaw']>): ReturnType<T['toRaw']>[] {
		return this.items.map(item => item.toRaw(...args));
	}

	async toObject(...args: Parameters<T['toObject']>): Promise<Awaited<ReturnType<T['toObject']>>[]> {
		return (await Promise.all(this.items.map(item => item.toObject(...args)))) as Awaited<
			ReturnType<T['toObject']>
		>[];
	}
}
