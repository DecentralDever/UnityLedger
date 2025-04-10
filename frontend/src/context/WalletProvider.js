import { jsx as _jsx } from "react/jsx-runtime";
// src/context/WalletProvider.tsx
import { createContext, useState, useContext, useEffect } from 'react';
import { ethers } from 'ethers';
const WalletContext = createContext({
    account: null,
    provider: null,
    signer: null,
    isConnecting: false,
    error: null,
    connect: async () => { },
    disconnect: async () => { },
});
export const useWallet = () => useContext(WalletContext);
export const WalletProvider = ({ children }) => {
    const [account, setAccount] = useState(null);
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState(null);
    // Connect wallet function using ethers.js
    const connect = async () => {
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
                window.ethereum.on('accountsChanged', (newAccounts) => {
                    if (newAccounts.length === 0) {
                        disconnect();
                    }
                    else {
                        setAccount(newAccounts[0]);
                        localStorage.setItem('connectedAccount', newAccounts[0]);
                    }
                });
            }
            else {
                throw new Error("No Ethereum provider found. Please install MetaMask or another compatible wallet.");
            }
        }
        catch (err) {
            console.error("Wallet connection error:", err);
            setError(err instanceof Error ? err : new Error('An unknown error occurred'));
        }
        finally {
            setIsConnecting(false);
        }
    };
    // Disconnect wallet function
    const disconnect = async () => {
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
            }
            catch (err) {
                console.error("Failed to restore wallet connection:", err);
                localStorage.removeItem('connectedAccount');
            }
        };
        checkConnection();
    }, []);
    const value = {
        account,
        provider,
        signer,
        isConnecting,
        error,
        connect,
        disconnect,
    };
    return (_jsx(WalletContext.Provider, { value: value, children: children }));
};
export default WalletProvider;
