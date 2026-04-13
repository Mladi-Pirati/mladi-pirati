/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly APPLICATIONS_RECEIVER_MEMBERSHIP_ENDPOINT?: string;
  readonly APPLICATIONS_RECEIVER_SHARED_SECRET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
