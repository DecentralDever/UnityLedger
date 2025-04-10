// src/context/WalletProvider.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';

export interface WalletContextValue {
  account: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  isConnecting: boolean;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue>({
  account: null,
  provider: null,
  signer: null,
  isConnecting: false,
  error: null,
  connect: async () => {},
  disconnect: async () => {},
});

export const useWallet = () => useContext(WalletContext);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Connect wallet function using ethers.js
  const connect = async (): Promise<void> => {
    setIsConnecting(true);
    setError(null);

    try {
      if (window.ethereum) {
        // Create an ethers provider from window.ethereum
        const ethersProvider = new ethers.BrowserProvider(window.ethereum);
        // Request accounts
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const connectedAccount = accounts[0];
        // Set up signer from the provider
        const signer = await ethersProvider.getSigner();
        setProvider(ethersProvider);
        setSigner(signer);
        setAccount(connectedAccount);
        localStorage.setItem('connectedAccount', connectedAccount);

        // Listen for account changes
        window.ethereum.on('accountsChanged', (newAccounts: string[]) => {
          if (newAccounts.length === 0) {
            disconnect();
          } else {
            setAccount(newAccounts[0]);
            localStorage.setItem('connectedAccount', newAccounts[0]);
          }
        });
      } else {
        throw new Error("No Ethereum provider found. Please install MetaMask or another compatible wallet.");
      }
    } catch (err) {
      console.error("Wallet connection error:", err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet function
  const disconnect = async (): Promise<void> => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    localStorage.removeItem('connectedAccount');
    if (window.ethereum) {
      window.ethereum.removeAllListeners('accountsChanged');
    }
  };

  // Check if wallet is already connected
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const savedAccount = localStorage.getItem('connectedAccount');
        if (savedAccount && window.ethereum) {
          // Optionally, you might want to create a provider and signer if needed
          const ethersProvider = new ethers.BrowserProvider(window.ethereum);
          const signer = await ethersProvider.getSigner();
          setProvider(ethersProvider);
          setSigner(signer);
          setAccount(savedAccount);
        }
      } catch (err) {
        console.error("Failed to restore wallet connection:", err);
        localStorage.removeItem('connectedAccount');
      }
    };

    checkConnection();
  }, []);

  const value: WalletContextValue = {
    account,
    provider,
    signer,
    isConnecting,
    error,
    connect,
    disconnect,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

// Add this to make TypeScript happy with window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string, params?: any[] }) => Promise<any>;
      on: (eventName: string, listener: (...args: any[]) => void) => void;
      removeAllListeners: (eventName: string) => void;
    };
  }
}

export default WalletProvider;
