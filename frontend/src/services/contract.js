// src/services/contract.js
import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { useWallet } from '../context/WalletProvider'
import ledgerAbi from '../abis/UnityLedgerABI.json'
import tokenAbi from '../abis/ULTTokenABI.json'
import faucetABI from '../abis/ULTFaucetAbi.json'

// Contract addresses by chainId
const LEDGER_ADDRESS_MAP = {
  4202: import.meta.env.VITE_CONTRACT_ADDRESS, // Lisk Sepolia
  50312: import.meta.env.VITE_SOMNIA_CONTRACT_ADDRESS // Somnia
}

const TOKEN_ADDRESS_MAP = {
  4202: import.meta.env.VITE_ULT_CONTRACT_ADDRESS, // Lisk Sepolia
  50312: import.meta.env.VITE_SOMNIA_TOKEN_ADDRESS // Somnia
}

const FAUCET_ADDRESS_MAP = {
  4202: import.meta.env.VITE_LISK_FAUCET_ADDRESS, // Lisk Sepolia
  50312: import.meta.env.VITE_SOMNIA_FAUCET_ADDRESS // Somnia
}

// Network names for logging
const NETWORK_NAMES = {
  4202: "Lisk Sepolia",
  50312: "Somnia"
}

/**
 * Get network addresses for current chain with fallback
 */
export function getNetworkAddresses(chainId) {
  console.log('🔍 Detecting network - chainId:', chainId);
  
  const networkName = NETWORK_NAMES[chainId];
  
  if (!networkName) {
    console.warn(`⚠️ Unsupported network: ${chainId}, falling back to Lisk Sepolia`);
    return {
      unityLedger: LEDGER_ADDRESS_MAP[4202],
      ultToken: TOKEN_ADDRESS_MAP[4202],
      faucet: FAUCET_ADDRESS_MAP[4202],
      networkName: "Lisk Sepolia (fallback)",
      isSupported: false
    };
  }

  console.log(`✅ Connected to ${networkName} network`);
  console.log('📋 Addresses:', {
    unityLedger: LEDGER_ADDRESS_MAP[chainId],
    ultToken: TOKEN_ADDRESS_MAP[chainId],
    faucet: FAUCET_ADDRESS_MAP[chainId]
  });
  
  return {
    unityLedger: LEDGER_ADDRESS_MAP[chainId],
    ultToken: TOKEN_ADDRESS_MAP[chainId],
    faucet: FAUCET_ADDRESS_MAP[chainId],
    networkName,
    isSupported: true
  };
}

/**
 * Debug hook to log current network
 */
export function useNetworkDebugger() {
  const { provider } = useWallet();

  useEffect(() => {
    if (!window.ethereum || !provider) return;

    const logNetwork = async () => {
      try {
        // Get chainId from wallet
        const walletChainId = await window.ethereum.request({ method: 'eth_chainId' });
        console.log('🔗 Wallet chainId:', parseInt(walletChainId, 16));
        
        // Get chainId from provider
        const network = await provider.getNetwork();
        console.log('🌐 Provider chainId:', Number(network.chainId));
        
        // Check addresses
        const addresses = getNetworkAddresses(Number(network.chainId));
        console.log('🏠 Network supported:', addresses.isSupported);
      } catch (error) {
        console.error('❌ Network debug error:', error);
      }
    };

    logNetwork();
  }, [provider]);
}

/**
 * Returns an ethers.Contract for UnityLedger on the connected chain
 */
export function useUnityLedgerContract() {
  const { provider, signer } = useWallet()
  const [contract, setContract] = useState(null)

  useEffect(() => {
    if (!provider) {
      setContract(null)
      return
    }

    let cancelled = false
    
    const setupContract = async () => {
      try {
        const network = await provider.getNetwork()
        const chainId = Number(network.chainId)
        
        if (cancelled) return
        
        const addresses = getNetworkAddresses(chainId)
        
        if (!addresses.unityLedger) {
          console.warn(`❌ No UnityLedger address for chain ${chainId}`)
          setContract(null)
          return
        }

        console.log(`🔧 Setting up UnityLedger contract at ${addresses.unityLedger}`)
        const instance = new ethers.Contract(
          addresses.unityLedger, 
          ledgerAbi, 
          signer || provider
        )
        setContract(instance)
        
      } catch (error) {
        console.error('❌ Error setting up UnityLedger contract:', error)
        setContract(null)
      }
    }

    setupContract()
    return () => { cancelled = true }
  }, [provider, signer])

  return contract
}

/**
 * Returns an ethers.Contract for the ULT ERC-20 on the connected chain
 */
export function useUltTokenContract() {
  const { provider, signer } = useWallet()
  const [token, setToken] = useState(null)

  useEffect(() => {
    if (!provider) {
      setToken(null)
      return
    }

    let cancelled = false
    
    const setupContract = async () => {
      try {
        const network = await provider.getNetwork()
        const chainId = Number(network.chainId)
        
        if (cancelled) return
        
        const addresses = getNetworkAddresses(chainId)
        
        if (!addresses.ultToken) {
          console.warn(`❌ No ULTToken address for chain ${chainId}`)
          setToken(null)
          return
        }

        console.log(`🪙 Setting up ULT token contract at ${addresses.ultToken}`)
        const instance = new ethers.Contract(
          addresses.ultToken, 
          tokenAbi, 
          signer || provider
        )
        setToken(instance)
        
      } catch (error) {
        console.error('❌ Error setting up ULT token contract:', error)
        setToken(null)
      }
    }

    setupContract()
    return () => { cancelled = true }
  }, [provider, signer])

  return token
}

/**
 * Returns an ethers.Contract for the ULT Faucet on the connected chain
 */
export function useUltFaucetContract() {
  const { provider, signer } = useWallet()
  const [faucet, setFaucet] = useState(null)

  useEffect(() => {
    if (!provider) {
      setFaucet(null)
      return
    }

    let cancelled = false
    
    const setupContract = async () => {
      try {
        const network = await provider.getNetwork()
        const chainId = Number(network.chainId)
        
        if (cancelled) return
        
        const addresses = getNetworkAddresses(chainId)
        
        if (!addresses.faucet) {
          console.warn(`❌ No Faucet address for chain ${chainId}`)
          setFaucet(null)
          return
        }

        console.log(`🚰 Setting up Faucet contract at ${addresses.faucet}`)
        const instance = new ethers.Contract(
          addresses.faucet, 
          faucetABI, 
          signer || provider
        )
        setFaucet(instance)
        
      } catch (error) {
        console.error('❌ Error setting up Faucet contract:', error)
        setFaucet(null)
      }
    }

    setupContract()
    return () => { cancelled = true }
  }, [provider, signer])

  return faucet
}

/**
 * Hook to detect network changes and reload if needed
 */
export function useNetworkChangeHandler() {
  useEffect(() => {
    if (!window.ethereum) return

    const handleChainChanged = (chainId) => {
      const numericChainId = parseInt(chainId, 16);
      console.log(`🔄 Network changed to: ${numericChainId}`)
      
      // Small delay to let wallet finish switching
      setTimeout(() => {
        window.location.reload()
      }, 100)
    }

    const handleAccountsChanged = (accounts) => {
      console.log('👤 Accounts changed:', accounts)
      if (accounts.length === 0) {
        console.log('🔓 Wallet disconnected')
      }
    }

    window.ethereum.on('chainChanged', handleChainChanged)
    window.ethereum.on('accountsChanged', handleAccountsChanged)
    
    return () => {
      window.ethereum.removeListener('chainChanged', handleChainChanged)
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
    }
  }, [])
}