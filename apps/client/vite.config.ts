import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

const port = Number(process.env.PORT) || 3005;

export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url))
		}
	},
	server: {
		port,
		strictPort: true,
		cors: true
	},
	preview: {
		port,
		strictPort: true,
		cors: true
	}
});
