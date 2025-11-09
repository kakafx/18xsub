import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

/* ① 使用 Tailwind CSS v4 的独立 PostCSS 插件 */
import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.github\.com\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'github-api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
            },
          },
          {
            urlPattern: /^https:\/\/raw\.githubusercontent\.com\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'github-raw-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
        ],
      },
      manifest: {
        name: '18xsub',
        short_name: '18xsub',
        description: '基于 Cloudflare 的高性能订阅转换和管理工具',
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
          { src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
          { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
          { src: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
          { src: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
          { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
        categories: ['productivity', 'utilities'],
        lang: 'zh-CN',
        dir: 'ltr',
        prefer_related_applications: false,
        related_applications: [],
        screenshots: [
          {
            src: '/screenshots/desktop-1.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Dashboard view',
          },
          {
            src: '/screenshots/mobile-1.png',
            sizes: '390x844',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Mobile dashboard',
          },
        ],
        shortcuts: [
          {
            name: '访客模式',
            short_name: '访客',
           ',
            description: '直接进入访客模式获取订阅',
            url: '/?visitor=true',
            icons: [{ src: '/icons/visitor-icon.png', sizes: '96x96' }],
          },
          {
            name: '节点统计',
            short_name: '统计',
            description: '查看节点地区分布统计',
            url: '/?stats=true',
            icons: [{ src: '/icons/stats-icon.png', sizes: '96x96' }],
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],

  server: {
    port: 3000,
    host: '0.0.0.0',
    headers: {
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'pinia'],
          utils: ['clsx', 'js-yaml'],
        },
      },
    },
  },

  resolve: {
    alias: {
      '@': '/src',
    },
  },

  /* ② 正确调用 Tailwind CSS v4 的 PostCSS 插件 */
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
  },

  optimizeDeps: {
    include: ['vue', 'pinia', 'js-yaml', 'clsx'],
  },
});
