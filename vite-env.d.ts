/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_CONTRACT_ADDRESS: string;
    // Add other environment variables here if needed
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  