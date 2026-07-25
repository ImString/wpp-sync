const authTokenStorageName =
	import.meta.env.VITE_AUTH_TOKEN_STORAGE_NAME || import.meta.env.VITE_AUTH_STORAGE_NAME || 'wppsync.auth-token';
const refreshTokenStorageName = import.meta.env.VITE_REFRESH_TOKEN_STORAGE_NAME || 'wppsync.refresh-token';

const canUseStorage = () => typeof window !== 'undefined';

export const getAuthToken = () => {
	if (!canUseStorage()) return null;

	return sessionStorage.getItem(authTokenStorageName);
};

export const saveAuthToken = (token: string) => {
	if (!canUseStorage()) return;

	sessionStorage.setItem(authTokenStorageName, token);
};

export const removeAuthToken = () => {
	if (!canUseStorage()) return;

	localStorage.removeItem(authTokenStorageName);
	sessionStorage.removeItem(authTokenStorageName);
};

export const getRefreshToken = () => {
	if (!canUseStorage()) return null;

	return localStorage.getItem(refreshTokenStorageName) || sessionStorage.getItem(refreshTokenStorageName);
};

export const isRefreshTokenPersistent = () => {
	if (!canUseStorage()) return false;

	return Boolean(localStorage.getItem(refreshTokenStorageName));
};

export const saveRefreshToken = (token: string, remember = isRefreshTokenPersistent()) => {
	if (!canUseStorage()) return;

	localStorage.removeItem(refreshTokenStorageName);
	sessionStorage.removeItem(refreshTokenStorageName);
	(remember ? localStorage : sessionStorage).setItem(refreshTokenStorageName, token);
};

export const removeRefreshToken = () => {
	if (!canUseStorage()) return;

	localStorage.removeItem(refreshTokenStorageName);
	sessionStorage.removeItem(refreshTokenStorageName);
};
