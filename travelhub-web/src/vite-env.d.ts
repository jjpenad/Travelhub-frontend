/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Semver de `package.json`, inyectada en build por `vite.config.js`. */
  readonly VITE_APP_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
