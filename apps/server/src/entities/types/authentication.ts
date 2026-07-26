import type { JwtPayload } from 'jsonwebtoken';

export type AuthenticationTokenType = 'auth' | 'refresh';

export interface AuthenticationTokenPayload extends JwtPayload {
	id: string;
	tokenType: AuthenticationTokenType;
	iat: number;
	exp: number;
}
