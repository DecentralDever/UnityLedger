import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@typechain/hardhat";
require('dotenv').config();

const config: HardhatUserConfig = {
  solidity: "0.8.23",
  networks: {
    'lisk-sepolia': {
      url: process.env.LISK_SEPOLIA_RPC_URL,
      accounts: [process.env.WALLET_KEY as string],
      gasPrice: 1e9,
      chainId: 4202,
    },
    somnia: {
      url: "https://dream-rpc.somnia.network",
      accounts: [process.env.WALLET_KEY as string],
      chainId: 50312,
    },
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
  etherscan: {
    apiKey: {
      somnia: process.env.SOMNIA_ETHERSCAN_KEY || "1fa1b063d27be6274d34ee90d570c7c43464dca8047cf339c3d7f38faa6b7cb0",
    },
    customChains: [
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
};

export default config;
