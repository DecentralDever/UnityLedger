// scripts/configure-ult.js
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  // Network-specific addresses
  const addresses = {
    4202: { // Lisk Sepolia
      unityLedger: "0x48ab1f82e63980Ba8696FB4fe4EB3440ffaa19bb",
      ultToken: "0xCaB2f442dBaa702593d915dc1dD5333943081C37" // New ULT token
    },
    50312: { // Somnia
      unityLedger: "0x4aF3f338a552968ac9D766229d53676413cED918", 
      ultToken: "0x234CFEe105A2c7223Aae5a3F80c109EE6b5bB0F5" // New ULT token
    }
  };

  const config = addresses[Number(network.chainId)];
  if (!config) throw new Error(`Unsupported network: ${network.chainId}`);

  console.log(`🔗 Configuring ULT token on ${network.name}`);
  console.log(`UnityLedger: ${config.unityLedger}`);
  console.log(`ULT Token: ${config.ultToken}`);

  // Connect to contracts
  const unityLedger = await ethers.getContractAt("UnityLedger", config.unityLedger);
  const ultToken = await ethers.getContractAt("ULTToken", config.ultToken);

  // Set ULT token in UnityLedger
  console.log("Setting ULT token...");
  const setTx = await unityLedger.setUltToken(config.ultToken);
  await setTx.wait();
  console.log("✅ ULT token configured");

  // Transfer ULT ownership to UnityLedger
  console.log("Transferring ULT ownership...");
  const transferTx = await ultToken.transferOwnership(config.unityLedger);
  await transferTx.wait();
  console.log("✅ Ownership transferred");

  // Verify
  const configuredToken = await unityLedger.ultToken();
  const owner = await ultToken.owner();
  
  console.log(`Configured token: ${configuredToken}`);
  console.log(`Token owner: ${owner}`);
  console.log(`Status: ${configuredToken === config.ultToken && owner === config.unityLedger ? '✅ SUCCESS' : '❌ FAILED'}`);
}

main().catch(console.error);