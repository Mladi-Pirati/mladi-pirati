// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
const site = (process.env.SITE_URL ?? 'https://mladipirati.si').replace(/\/$/, '');

export default defineConfig({
  site,
  integrations: [sitemap()],
});
