// src/services/contract.js
import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { useWallet } from '../context/WalletProvider'
import ledgerAbi from '../abis/UnityLedgerABI.json'
import tokenAbi from '../abis/ULTTokenABI.json'
import faucetABI from '../abis/ULTFaucetAbi.json'

// Pick the right deployment by chainId
const LEDGER_ADDRESS_MAP = {
  // Lisk Sepolia
  4202: import.meta.env.VITE_CONTRACT_ADDRESS,
  // Somnia
  50312: import.meta.env.VITE_SOMNIA_CONTRACT_ADDRESS
}

const TOKEN_ADDRESS_MAP = {
  // Lisk Sepolia
  4202: import.meta.env.VITE_ULT_CONTRACT_ADDRESS,
  // Somnia
  50312: import.meta.env.VITE_SOMNIA_TOKEN_ADDRESS
}

/**
 * Returns an ethers.Contract for UnityLedger on the connected chain,
 * or null if provider is missing or no address is configured.
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
    provider.getNetwork().then(({ chainId }) => {
      if (cancelled) return
      const address = LEDGER_ADDRESS_MAP[chainId]
      if (!address) {
        console.warn(`No UnityLedger address for chain ${chainId}`)
        setContract(null)
      } else {
        const instance = new ethers.Contract(address, ledgerAbi, signer || provider)
        setContract(instance)
      }
    })

    return () => { cancelled = true }
  }, [provider, signer])

  return contract
}

/**
 * Returns an ethers.Contract for the ULT ERC-20 on the connected chain,
 * or null if provider is missing or no address is configured.
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
    provider.getNetwork().then(({ chainId }) => {
      if (cancelled) return
      const address = TOKEN_ADDRESS_MAP[chainId]
      if (!address) {
        console.warn(`No ULTToken address for chain ${chainId}`)
        setToken(null)
      } else {
        const instance = new ethers.Contract(address, tokenAbi, signer || provider)
        setToken(instance)
      }
    })

    return () => { cancelled = true }
  }, [provider, signer])

  return token
}
