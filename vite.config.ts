import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { copyFileSync, mkdirSync, readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';

/** Copy the read-only content package into public/ at build time so it's served as static files. */
function copyContentToPublic() {
  return {
    name: 'copy-content-to-public',
    buildStart() {
      const src = path.resolve(__dirname, 'content/msl');
      const dest = path.resolve(__dirname, 'public/content/msl');
      mkdirSync(dest, { recursive: true });
      for (const file of readdirSync(src)) {
        const srcPath = path.join(src, file);
        if (!statSync(srcPath).isFile()) continue;
        // Minify JSON on copy — strips whitespace, ~30% size reduction on signs.json
        if (file.endsWith('.json')) {
          const data = JSON.parse(readFileSync(srcPath, 'utf-8'));
          writeFileSync(path.join(dest, file), JSON.stringify(data));
        } else {
          copyFileSync(srcPath, path.join(dest, file));
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [
    copyContentToPublic(),
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
        // Exclude content JSON and index.html from precache.
        // - Content JSON: fetched at runtime via runtimeCaching rules below.
        // - index.html: MUST NOT be precached. If it is, old SW instances serve
        //   stale HTML referencing old chunk hashes → 404 on chunks → blank page.
        //   Serving it fresh ensures the browser always gets the current build's
        //   chunk hashes, eliminating the "loading loop" after redeployments.
        globPatterns: ['**/*.{js,css,svg,png,ico,webp}'],
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        // Deny-list: skip precache for HTML files so index.html is always fresh.
        navigateFallbackDenylist: [],
        runtimeCaching: [
          {
            // Content package — cache on first load, serve from cache thereafter.
            // signs.json is ~2 MB but we only want it fetched once.
            urlPattern: /\/content\/msl\/.*\.json$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'msl-content',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year — content doesn't change
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
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
