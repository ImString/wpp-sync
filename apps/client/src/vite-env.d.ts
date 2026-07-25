/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_API_URL?: string;
	readonly VITE_AUTH_TOKEN_STORAGE_NAME?: string;
	readonly VITE_AUTH_STORAGE_NAME?: string;
	readonly VITE_REFRESH_TOKEN_STORAGE_NAME?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
