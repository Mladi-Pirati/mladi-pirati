import type { APIRoute } from "astro";
import { siteMetadata } from "../config/site";

export const GET: APIRoute = ({ site }) => {
  const origin = (site?.toString() ?? siteMetadata.siteUrl).replace(/\/$/, "");
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap-index.xml\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
