import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiKey = env.WARERA_API_KEY || env.VITE_WARERA_API_KEY || 'wae_7152c6d478d157069e449cf27f377458bafc5133686f8c222252af4b8828f09e';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api/warera': {
          target: 'https://api2.warera.io',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/warera/, '/trpc'),
          headers: {
            'x-api-key': apiKey,
          },
        },
      },
    },
  };
});
