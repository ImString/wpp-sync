import { prisma } from '@wppsync/database';
import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';

import { Provider } from '@/core/index.js';

import { HttpResponse } from '@/modules/index.js';

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

		if (!userFromEmail) {
			return HttpResponse.error(401, 'USER_OR_PASSWORD_INCORRECT', { message: 'User or password incorrect.' });
		}

		if (userFromEmail.password === null) {
			return HttpResponse.error(400, 'USER_NO_PASSWORD_USE_SOCIAL_LOGIN', {
				message: 'User does not have a password, use social login.'
			});
		}

		const isPasswordValid = await bcrypt.compare(document.password, userFromEmail.password);
		if (!isPasswordValid) {
			return HttpResponse.error(401, 'USER_OR_PASSWORD_INCORRECT', {
				message: 'User or password incorrect.'
			});
		}

		return HttpResponse.success({
			token: this.generateToken(userFromEmail.id, 'auth'),
			refreshToken: this.generateToken(userFromEmail.id, 'refresh')
		});
	}

	async register(document: { name: string; email: string; phone?: string; password: string }) {
		const name = document.name.trim();
		const userWithSameEmail = await prisma.user.findFirst({
			where: {
				email: document.email
			}
		});

		if (userWithSameEmail) {
			return HttpResponse.error(400, 'USER_EMAIL_ALREADY_EXISTS', {
				message: 'User with same e-mail already exists.'
			});
		}

		const passwordHash = await bcrypt.hash(document.password, this.bcryptCost);

		const newUserId = await prisma.user.create({
			data: {
				name: name,
				email: document.email,
				phone: document.phone,
				password: passwordHash
			}
		});

		if (!newUserId) {
			return HttpResponse.error(500, 'USER_COULD_NOT_BE_CREATED', {
				message: 'User could not be created.'
			});
		}

		return HttpResponse.success({});
	}

	verifyToken(token: string, expectedTokenType?: AuthenticationTokenType): AuthenticationTokenPayload | null {
		try {
			const payload = jwt.verify(token, this.secretToken, {
				algorithms: ['HS256'],
				issuer: process.env.JWT_ISSUER,
				audience: process.env.JWT_AUDIENCE
			});

			if (!this.isAuthenticationTokenPayload(payload)) return null;
			if (expectedTokenType && payload.tokenType !== expectedTokenType) return null;

			return payload;
		} catch {
			return null;
		}
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
