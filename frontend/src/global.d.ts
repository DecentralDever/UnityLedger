// src/global.d.ts
export {};

declare global {
  interface Window {
    ethereum?: any; // You can use a more specific type if desired, e.g., from '@metamask/providers'
  }
}
