import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@typechain/hardhat";
require('dotenv').config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.23",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    'lisk-sepolia': {
      url: process.env.LISK_SEPOLIA_RPC_URL || "https://rpc.sepolia-api.lisk.com",
      accounts: [process.env.WALLET_KEY as string],
      gasPrice: 1e9,
      chainId: 4202,
      timeout: 60000,
    },
    somnia: {
      url: "https://dream-rpc.somnia.network",
      accounts: [process.env.WALLET_KEY as string],
      chainId: 50312,
      timeout: 60000,
      gasPrice: "auto",
    },
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
  etherscan: {
    apiKey: {
      'lisk-sepolia': process.env.LISK_ETHERSCAN_KEY || "placeholder",
      somnia: process.env.SOMNIA_ETHERSCAN_KEY || "1fa1b063d27be6274d34ee90d570c7c43464dca8047cf339c3d7f38faa6b7cb0",
    },
    customChains: [
      {
        network: "lisk-sepolia",
        chainId: 4202,
        urls: {
          apiURL: "https://sepolia-blockscout.lisk.com/api",
          browserURL: "https://sepolia-blockscout.lisk.com",
        },
      },
      {
        network: "somnia",
        chainId: 50312,
        urls: {
          apiURL: "https://shannon-explorer.somnia.network/api",
          browserURL: "https://shannon-explorer.somnia.network",
        },
      },
    ],
  },
  sourcify: { enabled: false },
  mocha: {
    timeout: 40000,
  },
};

export default config;