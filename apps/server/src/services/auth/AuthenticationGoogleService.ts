import { Provider } from '@wppsync/backend';
import { prisma, UserIntegrationType } from '@wppsync/database';
import { OAuth2Client } from 'google-auth-library';
import { randomUUID } from 'node:crypto';

import { RedisModule } from '@/modules/modules.js';

import { UserEntity } from '@/entities/data/index.js';
import {
	ExpiredGoogleAuthStateError,
	GoogleAuthCredentialsRequiredError,
	GoogleEmailNotVerifiedError,
	GoogleIdTokenMissingError,
	GoogleIntegrationUserNotFoundError,
	InvalidGoogleIdTokenPayloadError
} from '@/entities/errors/authentication/index.js';

import { UserService, UserIntegrationService } from '../user/index.js';

interface GoogleAuthAdapterUrlData {
	url: string;
	state: string;
}

interface GoogleAuthLoginDocument {
	code?: string;
	token?: string;
	state: string;
}

@Provider()
export class AuthenticationGoogleService {
	constructor(
		private readonly userService: UserService,
		private readonly userIntegrationService: UserIntegrationService
	) {}

	cachePrefix = 'google:auth';

	async generateAuthUrl(): Promise<GoogleAuthAdapterUrlData> {
		const authUrlData = this.generateUrl('online', ['openid', 'email', 'profile']);

		await RedisModule.client?.setex(`${this.cachePrefix}:${authUrlData.state}`, 15 * 60, 'true');

		return { url: authUrlData.url, state: authUrlData.state };
	}

	async loginWithGoogle(document: GoogleAuthLoginDocument): Promise<{ user: UserEntity; isNewIntegration: boolean }> {
		const isValidState = await RedisModule.client?.get(`${this.cachePrefix}:${document.state}`);
		if (!isValidState) throw new ExpiredGoogleAuthStateError();

		await RedisModule.client?.del(`${this.cachePrefix}:${document.state}`);
		if (!document.code && !document.token) throw new GoogleAuthCredentialsRequiredError();

		const client = this.createClient();
		const credentials = document.code
			? (await client.getToken(document.code)).tokens
			: { id_token: document.token };

		if (!credentials.id_token) throw new GoogleIdTokenMissingError();

		client.setCredentials(credentials);

		const ticket = await client.verifyIdToken({
			idToken: credentials.id_token,
			audience: process.env.GOOGLE_CLIENT_ID
		});

		const payload = ticket.getPayload();

		if (!payload?.sub || !payload.email) throw new InvalidGoogleIdTokenPayloadError();
		if (!payload.email_verified) throw new GoogleEmailNotVerifiedError();

		let user: UserEntity | null = null;

		const existingIntegration = await prisma.userIntegration.findFirst({
			where: {
				providerId: payload.sub,
				type: UserIntegrationType.GOOGLE
			}
		});

		if (existingIntegration) {
			user = await this.userService.get({ id: existingIntegration.userId }).catch(() => null);

			if (!user) throw new GoogleIntegrationUserNotFoundError();

			return { user, isNewIntegration: false };
		}

		const emailUser = await this.userService.get({ email: payload.email }).catch(() => null);
		if (emailUser) {
			const emailIntegration = await prisma.userIntegration.findFirst({
				where: {
					userId: emailUser.id,
					type: UserIntegrationType.GOOGLE
				}
			});

			if (emailIntegration) {
				await prisma.userIntegration.update({
					where: { id: emailIntegration.id },
					data: {
						providerId: payload.sub,
						providerName: payload.name || emailIntegration.providerName
					}
				});

				return { user: emailUser, isNewIntegration: false };
			}

			user = emailUser;
		}

		if (!user) {
			user = await this.userService.create({
				name: payload.name || payload.email.split('@')[0],
				email: payload.email
			});
		}

		await this.userIntegrationService.create({
			user,
			type: UserIntegrationType.GOOGLE,
			providerId: payload.sub,
			providerName: payload.name || 'Unknown'
		});

		return { user, isNewIntegration: true };
	}

	private createClient(): OAuth2Client {
		const GoogleAuthClient = new OAuth2Client({
			clientId: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			redirectUri: `${process.env.CLIENT_FULL_URL}/auth/google/callback`
		});

		return GoogleAuthClient;
	}

	private generateStateCode(): string {
		return randomUUID();
	}

	private generateUrl(access_type: 'online' | 'offline', scope: string[]): GoogleAuthAdapterUrlData {
		const state = this.generateStateCode();

		const client = this.createClient();
		const url = client.generateAuthUrl({
			access_type,
			scope,
			state,
			prompt: 'select_account'
		});

		return { url, state };
	}
}
