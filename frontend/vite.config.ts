import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_PROXY_TARGET?.trim() || 'http://localhost:3000';

  return {
    plugins: [react()],
    resolve: {
      alias: [
        {
          find: '@',
          replacement: fileURLToPath(new URL('./src', import.meta.url)),
        },
        {
          find: 'next/link',
          replacement: fileURLToPath(
            new URL('./src/shims/next-link.tsx', import.meta.url),
          ),
        },
        {
          find: 'next/navigation',
          replacement: fileURLToPath(
            new URL('./src/shims/next-navigation.ts', import.meta.url),
          ),
        },
      ],
    },
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
