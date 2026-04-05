# Mladi Pirati

Uradna spletna stran Mladih Piratov — podmladka Piratske stranke Slovenije.

## Stack

- [Astro](https://astro.build) — static site generator
- JetBrains Mono + Monda — typography
- Typed client-side modules for hero animation, nav, and signup flow
- Vanilla JS — no frameworks

## Development

```sh
npm install
npm run dev
```

Dev server runs at `localhost:4321`.

## Environment

Copy `.env.example` to `.env` and set:

- `SITE_URL` — canonical production URL used for metadata and sitemap
- `PUBLIC_SIGNUP_ENDPOINT` — external form endpoint that receives signup submissions

## Build

```sh
npm run build
npm run preview
npm run typecheck
```

## License

All rights reserved. Mladi Pirati, 2025.
