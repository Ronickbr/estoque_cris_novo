import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
export default defineConfig({
    plugins: [react()],
    base: '/',
    publicDir: 'public',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        emptyOutDir: true,
        minify: 'esbuild',
        cssCodeSplit: true,
        sourcemap: true,
        rollupOptions: {
            output: {
                entryFileNames: 'assets/js/[name]-[hash].js',
                chunkFileNames: 'assets/js/[name]-[hash].js',
                assetFileNames: (assetInfo) => {
                    const name = assetInfo.name ?? 'asset';
                    const info = name.split('.');
                    const ext = info[info.length - 1];
                    if (/\.(css)$/.test(name)) {
                        return `assets/css/[name]-[hash].${ext}`;
                    }
                    if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(name)) {
                        return `assets/images/[name]-[hash].${ext}`;
                    }
                    if (/\.(woff2?|ttf|eot)$/.test(name)) {
                        return `assets/fonts/[name]-[hash].${ext}`;
                    }
                    return `assets/[name]-[hash].${ext}`;
                },
                manualChunks: (id) => {
                    if (id.includes('node_modules')) {
                        if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
                            return 'vendor';
                        }
                        if (id.includes('react-bootstrap') || id.includes('bootstrap')) {
                            return 'ui';
                        }
                        if (id.includes('@tanstack/react-query')) {
                            return 'query';
                        }
                        if (id.includes('react-hook-form') || id.includes('@hookform/resolvers') || id.includes('zod')) {
                            return 'forms';
                        }
                        return 'vendor';
                    }
                },
            },
        },
    },
    server: {
        port: 3000,
        open: true,
        cors: true,
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                secure: false,
            },
        },
    },
    resolve: {
        alias: {
            '@': resolve(import.meta.dirname, 'src'),
            '@components': resolve(import.meta.dirname, 'src/components'),
            '@pages': resolve(import.meta.dirname, 'src/pages'),
            '@hooks': resolve(import.meta.dirname, 'src/hooks'),
            '@utils': resolve(import.meta.dirname, 'src/utils'),
            '@types': resolve(import.meta.dirname, 'src/types'),
            '@services': resolve(import.meta.dirname, 'src/services'),
            '@context': resolve(import.meta.dirname, 'src/context'),
        },
    },
    css: {
        postcss: {},
        modules: false,
    },
    esbuild: {
        target: 'es2022',
        supported: {
            'top-level-await': true,
        },
    },
});
