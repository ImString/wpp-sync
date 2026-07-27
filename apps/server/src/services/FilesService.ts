import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { prisma } from '@wppsync/database';

import { FileEntity } from '@/entities/data/others/file.entity.js';

export interface FileUploadOptions {
	buffer: Buffer;
	name: string;
	key?: string;
	prefix?: string;
	mime_type?: string;
}

export class FilesService {
	private static s3?: S3Client;

	private static get bucket() {
		return this.getRequiredEnvironment('CLOUDFLARE_R2_BUCKET');
	}

	private static get client() {
		if (!this.s3) {
			const accountId = this.getRequiredEnvironment('CLOUDFLARE_ACCOUNT_ID');

			this.s3 = new S3Client({
				region: 'auto',
				endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
				credentials: {
					accessKeyId: this.getRequiredEnvironment('CLOUDFLARE_R2_KEY_ID'),
					secretAccessKey: this.getRequiredEnvironment('CLOUDFLARE_R2_KEY_SECRET')
				}
			});
		}

		return this.s3;
	}

	static async getFileById(fileId: string) {
		const file = await prisma.files.findUnique({ where: { id: fileId } });

		if (!file) throw new Error('File not found.');

		return file;
	}

	static async generateSignedFileURL(fileKey?: string, duration: number = 600, downloadName?: string) {
		if (!fileKey) return '';

		return getSignedUrl(
			this.client,
			new GetObjectCommand({
				Bucket: this.bucket,
				Key: fileKey,
				...(downloadName && {
					ResponseContentDisposition: `attachment; filename="${this.sanitizeDownloadName(downloadName)}"`
				})
			}),
			{ expiresIn: Math.max(1, Math.floor(duration)) }
		);
	}

	static async generateSignedFileURLById(fileId: string, duration: number = 600) {
		const file = await prisma.files.findUnique({ where: { id: fileId } });

		return file ? this.generateSignedFileURL(file.key, duration) : null;
	}

	static async upload(options: FileUploadOptions) {
		const key = options.key || FileEntity.generateKey(options.name, options.prefix);
		const response = await this.client.send(
			new PutObjectCommand({
				Bucket: this.bucket,
				Key: key,
				Body: options.buffer,
				ContentType: options.mime_type || 'application/octet-stream'
			})
		);

		this.assertSuccessfulResponse(response.$metadata.httpStatusCode, 'upload');

		const file = new FileEntity({
			name: options.name,
			key,
			mimeType: options.mime_type
		});

		try {
			await file.save();
		} catch (error) {
			await this.deleteStoredObject(key).catch(() => undefined);
			throw error;
		}

		file.buffer = options.buffer;

		return file;
	}

	static async uploadFile(
		fileBuffer: Buffer,
		fileName: string,
		fileType?: string,
		prefix?: string
	) {
		const file = await this.upload({
			buffer: fileBuffer,
			name: fileName,
			mime_type: fileType,
			prefix
		});

		return file.id;
	}

	static async downloadFileById(fileId: string) {
		const file = await this.getFileById(fileId);
		const response = await this.client.send(
			new GetObjectCommand({
				Bucket: this.bucket,
				Key: file.key
			})
		);
		const bytes = await response.Body?.transformToByteArray();

		if (!bytes) throw new Error('Failed to download file.');

		return Buffer.from(bytes);
	}

	static async deleteFileById(fileId: string) {
		const file = await this.getFileById(fileId);

		await this.deleteStoredObject(file.key);
		await prisma.files.delete({ where: { id: file.id } });
	}

	static async deleteFileByKey(fileKey: string) {
		await this.deleteStoredObject(fileKey);
		await prisma.files.deleteMany({ where: { key: fileKey } });
	}

	private static async deleteStoredObject(fileKey: string) {
		const response = await this.client.send(
			new DeleteObjectCommand({
				Bucket: this.bucket,
				Key: fileKey
			})
		);

		this.assertSuccessfulResponse(response.$metadata.httpStatusCode, 'delete');
	}

	private static assertSuccessfulResponse(statusCode: number | undefined, operation: string) {
		if (statusCode !== undefined && statusCode >= 200 && statusCode < 300) return;

		throw new Error(`Failed to ${operation} file.`);
	}

	private static getRequiredEnvironment(name: string) {
		const value = process.env[name];

		if (!value) throw new Error(`${name} is not configured.`);

		return value;
	}

	private static sanitizeDownloadName(name: string) {
		return name.replace(/["\\\r\n]/g, '_');
	}
}
