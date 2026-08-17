import { UserIntegration } from '@wppsync/database';

import { Entity } from '../Entity.js';

export type UserIntegrationEntityRaw = Partial<UserIntegration>;
export type UserIntegrationEntityExtra = {};
export type UserIntegrationEntityEntities = {};

export type UserIntegrationEntityPopulated = UserIntegrationEntityRaw & UserIntegrationEntityExtra;

export class UserIntegrationEntity extends Entity<
	UserIntegrationEntityRaw,
	UserIntegrationEntityExtra,
	UserIntegrationEntityEntities
> {
	constructor(data: UserIntegrationEntityPopulated = {}, entities: UserIntegrationEntityEntities = {}) {
		const { ...normalData } = data;
		const dataEntities = { ...entities };

		super({
			data: normalData,
			extra: {},
			entities: dataEntities
		});
	}

	async toObject() {
		return {};
	}
}
