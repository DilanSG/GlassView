import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // La actualización la avisa la app y el usuario decide cuándo recargar.
      registerType: 'prompt',
      injectRegister: null,
      // Iconos del navegador y logo de la app (los del manifiesto los añade el plugin).
      includeAssets: ['icono.png', 'icons/apple-touch-icon.png', 'icons/favicon-32x32.png'],
      manifest: {
        id: '/',
        name: 'GlassView — Planos de cristalería',
        short_name: 'GlassView',
        description:
          'Planos y despiece de instalaciones de cristalería, a escala real y en centímetros.',
        lang: 'es',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#f5f5f7',
        theme_color: '#f5f5f7',
        categories: ['productivity', 'business', 'utilities'],
        // Permite a Chrome comprobar con getInstalledRelatedApps() si la PWA
        // ya está instalada en el dispositivo.
        related_applications: [
          { platform: 'webapp', url: 'https://glass-view.vercel.app/manifest.webmanifest' },
        ],
        icons: [
          { src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Proyectos',
            short_name: 'Proyectos',
            description: 'Ver los planos guardados',
            url: '/proyectos',
            icons: [{ src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Nuevo proyecto',
            short_name: 'Nuevo',
            description: 'Crear un plano desde cero',
            url: '/nuevo-proyecto',
            icons: [{ src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Piezas personalizadas',
            short_name: 'Piezas',
            description: 'Diseñar piezas propias',
            url: '/piezas',
            icons: [{ src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
      },
      workbox: {
        // Los iconos del manifiesto los añade el propio plugin.
        globPatterns: ['**/*.{js,css,html,svg,ico,woff,woff2}'],
        // Sin conexión, cualquier ruta abre la aplicación (el shell precargado).
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Imágenes estáticas (iconos, capturas): primero la caché.
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'glassview-imagenes',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      // En desarrollo, las llamadas a /api se redirigen al backend local.
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
