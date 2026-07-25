export type AuthenticationStatus = 'idle' | 'checking' | 'authenticated' | 'unauthenticated';

export interface AuthUser {
	id: string;
	name: string;
	email: string;
	avatarUrl?: string | null;
	role?: string;
}

export interface AuthenticationStore {
	authToken: string | null;
	refreshToken: string | null;
	currentUser: AuthUser | null;
	status: AuthenticationStatus;
	setChecking: () => void;
	setAuthToken: (token: string | null) => void;
	setRefreshToken: (token: string | null, remember?: boolean) => void;
	setCurrentUser: (user: AuthUser) => void;
	clearAuthentication: () => void;
}
