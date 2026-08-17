const googleOAuthRequestStorageName = 'wppsync.google-oauth-request';
const googleOAuthRequestLifetime = 15 * 60 * 1000;

export interface GoogleOAuthRequest {
	state: string;
	returnTo?: string;
	createdAt: number;
}

const canUseStorage = () => typeof window !== 'undefined';

const isSafeReturnPath = (path?: string) => Boolean(path?.startsWith('/') && !path.startsWith('//'));

export const saveGoogleOAuthRequest = (state: string, returnTo?: string) => {
	if (!canUseStorage()) return;

	const request: GoogleOAuthRequest = {
		state,
		createdAt: Date.now(),
		...(isSafeReturnPath(returnTo) && { returnTo })
	};

	sessionStorage.setItem(googleOAuthRequestStorageName, JSON.stringify(request));
};

export const consumeGoogleOAuthRequest = (): GoogleOAuthRequest | null => {
	if (!canUseStorage()) return null;

	const storedRequest = sessionStorage.getItem(googleOAuthRequestStorageName);
	sessionStorage.removeItem(googleOAuthRequestStorageName);
	if (!storedRequest) return null;

	try {
		const request = JSON.parse(storedRequest) as Partial<GoogleOAuthRequest>;
		if (typeof request.state !== 'string' || typeof request.createdAt !== 'number') return null;
		if (Date.now() - request.createdAt > googleOAuthRequestLifetime) return null;

		return {
			state: request.state,
			createdAt: request.createdAt,
			...(isSafeReturnPath(request.returnTo) && { returnTo: request.returnTo })
		};
	} catch {
		return null;
	}
};
