// src/services/chains/chainConfig.js
export const CHAIN_TYPES = {
  EVM: 'evm',
  STELLAR: 'stellar'
};

export const SUPPORTED_CHAINS = {
  // Your existing EVM chains (enhanced)
  LISK_SEPOLIA: {
    id: 'lisk-sepolia',
    chainId: 4202,
    name: 'Lisk Sepolia',
    type: CHAIN_TYPES.EVM,
    rpcUrl: 'https://rpc.sepolia-api.lisk.com',
    contracts: {
      unityLedger: import.meta.env.VITE_CONTRACT_ADDRESS,
      ultToken: import.meta.env.VITE_ULT_CONTRACT_ADDRESS,
      faucet: import.meta.env.VITE_LISK_FAUCET_ADDRESS
    },
    features: ['basic_stokvel', 'ult_rewards'],
    currency: 'ETH',
    icon: '🔷',
    description: 'Ethereum Layer 2 with low fees'
  },
  SOMNIA: {
    id: 'somnia',
    chainId: 50312,
    name: 'Somnia',
    type: CHAIN_TYPES.EVM,
    contracts: {
      unityLedger: import.meta.env.VITE_SOMNIA_CONTRACT_ADDRESS,
      ultToken: import.meta.env.VITE_SOMNIA_TOKEN_ADDRESS,
      faucet: import.meta.env.VITE_SOMNIA_FAUCET_ADDRESS
    },
    features: ['basic_stokvel', 'ult_rewards'],
    currency: 'ETH',
    icon: '⚡',
    description: 'Fast EVM-compatible blockchain'
  },
  // NEW: Stellar with Blend integration
  STELLAR_TESTNET: {
    id: 'stellar-testnet',
    chainId: 'stellar-testnet',
    name: 'Stellar + Blend',
    type: CHAIN_TYPES.STELLAR,
    rpcUrl: 'https://soroban-testnet.stellar.org:443',
    networkPassphrase: 'Test SDF Network ; September 2015',
    contracts: {
      unityLedger: import.meta.env.VITE_STELLAR_UNITY_CONTRACT, // Will be set after deployment
      blendPools: {
        USDC: 'CCIXHGAVQGQ7TKTXQMFM4NKUQQ3H6QJ7QSACJH7VU2PLLG5TPDRYJKQL',
        XLM: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHAGCF7YG'
      }
    },
    features: ['basic_stokvel', 'ult_rewards', 'blend_yield', 'low_fees'],
    currency: 'XLM',
    icon: '⭐',
    description: 'Yield-enhanced stokvels with Blend Capital'
  }
};

export const getChainById = (chainId) => {
  return Object.values(SUPPORTED_CHAINS).find(chain => 
    chain.chainId === chainId || chain.id === chainId
  );
};

export const getDefaultChain = () => SUPPORTED_CHAINS.LISK_SEPOLIA;