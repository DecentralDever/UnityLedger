// src/services/contract.ts
import { ethers } from 'ethers';
import { useMemo } from 'react';
import abiJson from '../abis/UnityLedgerABI.json';
import { useWallet } from '../context/WalletProvider';
// Cast the imported ABI to ethers.InterfaceAbi
const abi = abiJson;
const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
console.log("Contract Address:", contractAddress);
export function useUnityLedgerContract() {
    const { provider, signer } = useWallet();
    return useMemo(() => {
        if (!provider)
            return null;
        return new ethers.Contract(contractAddress, abi, signer ?? provider);
    }, [provider, signer]); // This memoizes the contract instance
}
