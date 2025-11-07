// src/services/contracts/contractManager.js
import { EVMUnityLedger } from './evmContract';
import { StellarUnityLedger } from './stellarContract';

export class ContractManager {
  static getContract(chainType, address) {
    switch(chainType) {
      case 'evm':
        return new EVMUnityLedger(address);
      case 'stellar':
        return new StellarUnityLedger(address);
    }
  }
}
