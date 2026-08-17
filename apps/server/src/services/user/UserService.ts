import type { MultipartFile } from '@fastify/multipart';
import { Prisma, prisma } from '@wppsync/database';
import sharp from 'sharp';

import { Provider } from '@/core/index.js';

import { UserEntity } from '@/entities/data/others/user.entity.js';
import type { UserDTO } from '@/entities/dtos/user.dto.js';
import { UserNotFoundError } from '@/entities/errors/user/index.js';

import { FilesService } from '../FilesService.js';

export type UserServiceWhereInput = Prisma.UserWhereInput;
export type UserServiceWhereOptions = {
	id?: string;
	email?: string;

	include?: Prisma.UserInclude;
};

@Provider()
export class UserService {
	private mountWhere(options: UserServiceWhereOptions): UserServiceWhereInput {
		return {
			...(options.id && { id: options.id }),
			...(options.email && { email: options.email })
		};
	}

	async get(options: UserServiceWhereOptions): Promise<UserEntity> {
		return await this.getEntity(options);
	}

	async create(document: { name: string; email: string }) {
		const user = await prisma.user.create({
			data: {
				name: document.name,
				email: document.email
			}
		});

		const userEntity = new UserEntity(user);

		return userEntity;
	}

	async updateProfile(id: string, document: UserDTO.UpdateProfileDocument, avatar?: MultipartFile) {
		const user = await this.get({ id });
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

	private async getEntity(options: UserServiceWhereOptions) {
		const data = await prisma.user.findFirst({
			where: {
				...this.mountWhere(options)
			},
			include: options.include
		});

		if (!data) throw new UserNotFoundError();

		return new UserEntity(data);
	}
}
