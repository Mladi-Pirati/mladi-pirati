import { defineMiddleware } from "astro:middleware";
import { blockedRobotsPolicy, siteMetadata } from "./config/site";

export const onRequest = defineMiddleware(async (_, next) => {
  const response = await next();

  if (siteMetadata.indexingEnabled) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.set("X-Robots-Tag", blockedRobotsPolicy);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
