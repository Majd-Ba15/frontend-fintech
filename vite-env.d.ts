/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE: string;
  // add more VITE_ env vars as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
