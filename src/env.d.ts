/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly ALLOW_INDEXING?: string;
  readonly APPLICATIONS_RECEIVER_MEMBERSHIP_ENDPOINT?: string;
  readonly APPLICATIONS_RECEIVER_SHARED_SECRET?: string;
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
