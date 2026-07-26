import { prisma } from '@wppsync/database';
import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';

import { Provider } from '@/core/index.js';

import {
	InvalidCredentialsError,
	InvalidTokenError,
	SocialLoginRequiredError
} from '@/entities/errors/authentication/index.js';
import { UserEmailAlreadyExistsError } from '@/entities/errors/user/index.js';
import type { AuthenticationTokenPayload, AuthenticationTokenType } from '@/entities/types/authentication.js';

@Provider()
export class AuthenticationService {
	private bcryptCost: number = 12;
	private secretToken = process.env.JWT_SECRET || '';

	async login(document: { email: string; password: string }) {
		const userFromEmail = await prisma.user.findFirst({
			where: {
				email: document.email
			}
		});

		if (!userFromEmail) throw new InvalidCredentialsError();
		if (userFromEmail.password === null) throw new SocialLoginRequiredError();

		const isPasswordValid = await bcrypt.compare(document.password, userFromEmail.password);
		if (!isPasswordValid) throw new InvalidCredentialsError();

		return {
			token: this.generateToken(userFromEmail.id, 'auth'),
			refreshToken: this.generateToken(userFromEmail.id, 'refresh')
		};
	}

	async register(document: { name: string; email: string; phone?: string; password: string }) {
		const name = document.name.trim();
		const userWithSameEmail = await prisma.user.findFirst({
			where: {
				email: document.email
			}
		});

		if (userWithSameEmail) throw new UserEmailAlreadyExistsError();

		const passwordHash = await bcrypt.hash(document.password, this.bcryptCost);

		return prisma.user.create({
			data: {
				name: name,
				email: document.email,
				phone: document.phone,
				password: passwordHash
			},
			select: {
				id: true,
				name: true,
				email: true,
				phone: true,
				createdAt: true,
				updatedAt: true
			}
		});
	}

	verifyToken(token: string, expectedTokenType?: AuthenticationTokenType): AuthenticationTokenPayload {
		let payload: unknown;

		try {
			payload = jwt.verify(token, this.secretToken, {
				algorithms: ['HS256'],
				issuer: process.env.JWT_ISSUER,
				audience: process.env.JWT_AUDIENCE
			});
		} catch {
			throw new InvalidTokenError();
		}

		if (!this.isAuthenticationTokenPayload(payload)) throw new InvalidTokenError();
		if (expectedTokenType && payload.tokenType !== expectedTokenType) throw new InvalidTokenError();

		return payload;
	}

	refreshToken(refreshToken: string) {
		const actualToken = this.verifyToken(refreshToken, 'refresh');
		const token = this.generateToken(actualToken.id, 'auth');
		const refreshThreshold = 7 * 24 * 60 * 60 * 1000;
		const shouldRotateRefreshToken = Date.now() > actualToken.exp * 1000 - refreshThreshold;

		return {
			token,
			...(shouldRotateRefreshToken && {
				refreshToken: this.generateToken(actualToken.id, 'refresh')
			})
		};
	}

	generateToken(userId: string, tokenType: AuthenticationTokenType): string {
		const authTokenExpiresIn = process.env.SESSION_TOKEN_AUTH_TIMEOUT || '1h';
		const refreshTokenExpiresIn = process.env.SESSION_TOKEN_REFRESH_TIMEOUT || '30d';
		const expiresIn = (
			tokenType === 'auth' ? authTokenExpiresIn : refreshTokenExpiresIn
		) as SignOptions['expiresIn'];

		return jwt.sign(
			{
				id: userId,
				tokenType
			},
			this.secretToken,
			{
				issuer: process.env.CLIENT_FULL_URL,
				audience: 'WPPSession',
				algorithm: 'HS256',
				header: { alg: 'HS256', typ: `${tokenType === 'auth' ? 'at' : 'rt'}-jwt` },
				expiresIn
			}
		);
	}

	private isAuthenticationTokenPayload(payload: unknown): payload is AuthenticationTokenPayload {
		if (typeof payload !== 'object' || payload === null) return false;

		const token = payload as Record<PropertyKey, unknown>;

		return (
			typeof token.id === 'string' &&
			(token.tokenType === 'auth' || token.tokenType === 'refresh') &&
			typeof token.iat === 'number' &&
			typeof token.exp === 'number'
		);
	}
}
