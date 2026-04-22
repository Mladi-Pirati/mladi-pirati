// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
const site = (process.env.SITE_URL ?? 'https://mladipirati.si').replace(/\/$/, '');
const allowIndexing = process.env.ALLOW_INDEXING === 'true';
const integrations = [
  icon({
    include: {
      'simple-icons': ['discord', 'instagram', 'tiktok', 'github'],
    },
  }),
  ...(allowIndexing ? [sitemap()] : []),
];

export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  site,
  integrations,
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: ["e3aa4a24d80a.ngrok.app"]
    }
  },
});
