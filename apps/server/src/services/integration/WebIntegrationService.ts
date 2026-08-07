import type { MultipartFile } from '@fastify/multipart';
import type { IntegrationWebConfig } from '@wppsync/database';
import sharp from 'sharp';

import { Provider } from '@/core/index.js';

import { IntegrationEntity } from '@/entities/data/index.js';
import type { IntegrationDTO } from '@/entities/dtos/integrations/integration.dto.js';
import { InvalidImageError } from '@/entities/errors/image/InvalidImageError.js';
import { UnsupportedImageError } from '@/entities/errors/image/UnsupportedImageError.js';

import { FilesService } from '../FilesService.js';
import { IntegrationService } from './IntegrationService.js';

@Provider()
export class WebIntegrationService {
	constructor(private readonly integrationService: IntegrationService) {}

	async updateConfig(
		integration: IntegrationEntity,
		document: IntegrationDTO.WebConfigDocument,
		headerPhoto?: MultipartFile
	) {
		const previousConfig = (integration.config ?? {}) as Partial<IntegrationWebConfig>;
		let uploadedHeaderPhoto;

		if (headerPhoto) {
			if (!['image/jpeg', 'image/png', 'image/webp'].includes(headerPhoto.mimetype)) {
				throw new UnsupportedImageError();
			}

			let photoBuffer: Buffer;

			try {
				photoBuffer = await sharp(await headerPhoto.toBuffer())
					.rotate()
					.resize(512, 512, {
						fit: 'cover',
						position: 'centre'
					})
					.webp({ quality: 82 })
					.toBuffer();
			} catch {
				throw new InvalidImageError();
			}

			uploadedHeaderPhoto = await FilesService.upload({
				buffer: photoBuffer,
				name: headerPhoto.filename.replace(/\.[^/.]+$/, '') + '.webp',
				mime_type: 'image/webp',
				prefix: `integrations/${integration.id}/header`
			});
		}

		const nextConfig: IntegrationWebConfig = {
			...previousConfig,
			headerName: document.headerName
		};

		if (uploadedHeaderPhoto) {
			nextConfig.headerPhotoId = uploadedHeaderPhoto.id;
		} else if (document.removeHeaderPhoto) {
			delete nextConfig.headerPhotoId;
		}

		try {
			await this.integrationService.update(integration, {
				...(document.name && { name: document.name }),
				config: nextConfig,
				status: 'CONNECTED'
			});
		} catch (error) {
			if (uploadedHeaderPhoto) await uploadedHeaderPhoto.delete().catch(() => undefined);
			throw error;
		}

		if (
			previousConfig.headerPhotoId &&
			(uploadedHeaderPhoto || document.removeHeaderPhoto) &&
			previousConfig.headerPhotoId !== nextConfig.headerPhotoId
		) {
			await FilesService.deleteFileById(previousConfig.headerPhotoId).catch(() => undefined);
		}

		return integration;
	}

	async delete(integration: IntegrationEntity) {
		const previousConfig = integration.config as IntegrationWebConfig | null | undefined;
		const headerPhotoId = previousConfig?.headerPhotoId;
		let nextConfig = previousConfig;

		if (previousConfig && headerPhotoId) {
			const { headerPhotoId: _headerPhotoId, ...configWithoutPhoto } = previousConfig;
			nextConfig = configWithoutPhoto;
		}

		await this.integrationService.update(integration, {
			isDeleted: true,
			...(nextConfig !== undefined && { config: nextConfig })
		});

		if (headerPhotoId) await FilesService.deleteFileById(headerPhotoId);

		return integration;
	}
}
