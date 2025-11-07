// src/services/contracts/stellarContract.js
import { Contract, SorobanRpc } from '@stellar/stellar-sdk';
import { PoolContract } from '@blend-capital/blend-sdk';

export class StellarUnityLedger {
  constructor(contractAddress) {
    this.contract = new Contract(contractAddress);
    this.rpc = new SorobanRpc.Server("https://soroban-testnet.stellar.org:443");
  }
  
  async createPool(params) {
    // Stellar-specific pool creation with Blend integration
    return await this.contract.call('create_pool', {
      ...params,
      blend_pool: params.selectedBlendPool // New field for Stellar
    });
  }
  
  async getPoolYield(poolId) {
    // New method only available on Stellar
    return await this.contract.call('get_pool_yield', poolId);
  }
}