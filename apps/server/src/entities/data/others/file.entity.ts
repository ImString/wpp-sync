import { type Files, type Prisma } from '@wppsync/database';
import Sqids from 'sqids';

import { Entity } from '@/entities/data/Entity.js';
import { FilesService } from '@/services/FilesService.js';

import { EntityGroup } from '../Group.js';

export type FileEntityRaw = Partial<Files>;

export interface FileEntityObject {
	id: string;
	name?: string;
	key?: string;
	mimeType?: string | null;
	url?: string;
	createdAt?: Date;
}

export interface FileEntityObjectOptions {
	duration?: number;
	sign_file?: boolean;
}

export class FileEntity extends Entity<FileEntityRaw> {
	buffer?: Buffer;

	constructor(data: FileEntityRaw = {}) {
		super({ data });
	}

	async getURL(options: { duration?: number } = {}) {
		const duration = options.duration ?? 600;
		const cacheDuration = Math.max(duration - 5, 1) * 1000;

		return this.getFromCache(
			`file:${this.data.key ?? this.id}:url:${duration}`,
			() => FilesService.generateSignedFileURL(this.data.key, duration),
			{ duration: cacheDuration }
		);
	}

	async toObject(options: FileEntityObjectOptions = {}): Promise<FileEntityObject> {
		return {
			id: this.id,
			name: this.data.name,
			key: this.data.key,
			mimeType: this.data.mimeType,
			url: options.sign_file ? await this.getURL({ duration: options.duration }) : undefined,
			createdAt: this.data.createdAt
		};
	}

	async create() {
		const { id: _temporaryId, ...data } = this.toRaw();
		const createdFile = await this.db.files.create({
			data: data as Prisma.FilesUncheckedCreateInput
		});

		Object.assign(this.original, createdFile);
		this.changes = {};
	}

	async update() {
		const updatedFile = await this.db.files.update({
			where: {
				id: this.id
			},
			data: this.changes as Prisma.FilesUpdateInput
		});

		Object.assign(this.original, updatedFile);
		this.changes = {};
	}

	async delete() {
		await FilesService.deleteFileById(this.id);
		await super.delete();
	}

	static generateKey(name: string, prefix?: string) {
		const sqids = new Sqids();
		const fileName = this.toSlug(name.replace(/\.[^/.]+$/, '')) || 'file';
		const fileKey = `${fileName}-${sqids.encode([Date.now()])}`;

		if (!prefix) return fileKey;

		const safePrefix = prefix
			.split(/[\\/]+/)
			.map(part => this.toSlug(part))
			.filter(Boolean)
			.join('/');

		return safePrefix ? `${safePrefix}/${fileKey}` : fileKey;
	}

	static fromList(dataList: FileEntityRaw[]) {
		return new EntityGroup(dataList.map(data => new FileEntity(data)));
	}

	private static toSlug(value: string) {
		return value
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
	}
}
