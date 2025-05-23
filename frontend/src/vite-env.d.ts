/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONTRACT_ADDRESS: string;
  // add other variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
