// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
const site = (process.env.SITE_URL ?? 'https://mladipirati.si').replace(/\/$/, '');
const allowIndexing = process.env.ALLOW_INDEXING === 'true';

export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  site,
  integrations: allowIndexing ? [sitemap()] : [],
});
