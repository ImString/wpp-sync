import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const port = Number(process.env.PORT) || 3005;

export default defineConfig({
	plugins: [react(), tailwindcss()],
	server: {
		port,
		strictPort: true
	},
	preview: {
		port,
		strictPort: true
	}
});
