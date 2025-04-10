import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@typechain/hardhat";


require('dotenv').config();

const config: HardhatUserConfig = {
  solidity: "0.8.23",
  networks: {
    'lisk-sepolia': {
      url: 'https://rpc.sepolia-api.lisk.com',
      accounts: [process.env.WALLET_KEY as string],
      gasPrice: 1000000000
    }
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
  
  etherscan: {
    apiKey: {
      "lisk-sepolia": "123"
    },
    customChains: [
      {
        network: "lisk-sepolia",
        chainId: 4202,
        urls: {
          apiURL: "https://sepolia-blockscout.lisk.com/api",
          browserURL: "https://sepolia-blockscout.lisk.com"
        }
      }
    ]
  },
  sourcify: {
    enabled: false
  }
};

export default config;
