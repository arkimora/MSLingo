import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'icons/*.svg'],
      manifest: {
        name: 'MSLingo — Монгол дохионы хэл',
        short_name: 'MSLingo',
        description:
          'Монгол дохионы хэлийг сурах апп. Эх сурвалж: mnsl.mn.',
        lang: 'mn',
        theme_color: '#634c25',
        background_color: '#fdfcf8',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,json}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // mnsl.mn sign videos — cache on demand, large quota
            urlPattern: /^https:\/\/mnsl\.mn\/wp-content\/uploads\/.*\.(mp4|webm|jpg|jpeg|png|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mnsl-media',
              expiration: {
                maxEntries: 4000,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
              rangeRequests: true,
            },
          },
          {
            urlPattern: /^https:\/\/mnsl\.mn\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'mnsl-pages',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@content': path.resolve(__dirname, 'content'),
    },
  },
  server: {
    port: 5173,
  },
});
