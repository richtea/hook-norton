import { defineConfig, loadEnv } from "vite";
import type { UserConfig } from 'vite'
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = {...process.env, ...loadEnv(mode, process.cwd())};

  // Determine base path: use VITE_BASE_PATH if provided, otherwise use NODE_ENV check
  const basePath = env.VITE_BASE_PATH || '/';

  console.log(`Using base path: ${basePath}`);

  const config: UserConfig = {

    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    base: basePath,

    // Configure the development server to proxy API requests to the backend
    // This is for local development only; in production, the frontend is served as a subpath of the backend
    server: {
      proxy: {
        // Proxy API calls to the app service
        "/$$": {
          target: env.FAQUE_HTTPS || env.FAQUE_HTTP,
          changeOrigin: true,
          // rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  }

  return config;
});
