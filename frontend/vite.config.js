import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
var __dirname = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, process.cwd(), '');
    var target = env.VITE_API_PROXY_TARGET || 'https://localhost:49249';
    return {
        plugins: [react()],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, 'src')
            }
        },
        server: {
            port: 5173,
            strictPort: true,
            proxy: {
                '/api': {
                    target: target,
                    changeOrigin: true,
                    secure: false
                },
                '/hubs': {
                    target: target,
                    changeOrigin: true,
                    secure: false,
                    ws: true
                }
            }
        },
        build: {
            sourcemap: true,
            target: 'es2022',
            rollupOptions: {
                output: {
                    manualChunks: {
                        vendor: ['react', 'react-dom', 'react-router-dom'],
                        data: ['@tanstack/react-query', 'axios', 'zustand'],
                        ui: ['framer-motion', 'lucide-react', 'react-hot-toast']
                    }
                }
            }
        }
    };
});
