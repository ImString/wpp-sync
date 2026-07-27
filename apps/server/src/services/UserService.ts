import type { MultipartFile } from '@fastify/multipart';
import { prisma } from '@wppsync/database';
import sharp from 'sharp';

import { Provider } from '@/core/index.js';

import { UserEntity } from '@/entities/data/others/user.entity.js';
import type { UserDTO } from '@/entities/dtos/user.dto.js';
import { UserNotFoundError } from '@/entities/errors/user/index.js';

import { FilesService } from './FilesService.js';

@Provider()
export class UserService {
	private async getEntityById(id: string) {
		const user = await prisma.user.findUnique({
			where: { id },
			include: {
				avatar: true
			}
		});

		if (!user) throw new UserNotFoundError();

		return new UserEntity(user);
	}

	async getById(id: string) {
		const user = await this.getEntityById(id);

		return user.toObject({ sign_files: true });
	}

	async updateProfile(id: string, document: UserDTO.UpdateProfileDocument, avatar?: MultipartFile) {
		const user = await this.getEntityById(id);
		const previousAvatar = user.entities.avatar;
		let uploadedAvatar;

		if (avatar) {
			const newAvatarBuffer = await sharp(await avatar.toBuffer())
				.resize(512, 512, {
					fit: 'contain',
					background: { r: 255, g: 255, b: 255, alpha: 0 }
				})
				.webp()
				.toBuffer();

			uploadedAvatar = await FilesService.upload({
				buffer: newAvatarBuffer,
				name: avatar.filename.replace(/\.[^/.]+$/, '') + '.webp',
				mime_type: 'image/webp',
				prefix: `users/${id}/avatars`
			});

			user.addChange('filesId', uploadedAvatar.id);
			user.entities.avatar = uploadedAvatar;
		}

		user.addChanges(document);

		try {
			if (Object.keys(user.changes).length > 0) await user.save();
		} catch (error) {
			if (uploadedAvatar) await uploadedAvatar.delete().catch(() => undefined);
			throw error;
		}

		if (uploadedAvatar && previousAvatar) {
			await previousAvatar.delete().catch(() => undefined);
		}

		return user.toObject({ sign_files: true });
	}
}
