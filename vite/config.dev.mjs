import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'url';

// Helper to convert folder url to absolute path string
const pathFromRoot = (rel) => fileURLToPath(new URL(rel, import.meta.url));

export default defineConfig({
    resolve: {
        alias: {
            '@core': pathFromRoot('../src/core'),
            '@features': pathFromRoot('../src/features'),
            '@scenes': pathFromRoot('../src/scenes'),
            '@observability': pathFromRoot('../src/observability'),
        },
    },
    base: './',
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser'],
                },
            },
        },
    },
    server: {
        port: 8080,
    },
});
