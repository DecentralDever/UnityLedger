// scripts/configure-ult.js
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  // Network-specific addresses
  const addresses = {
    4202: { // Lisk Sepolia
      unityLedger: "0xF7C911C3542687F49Dd42a3F0D54A2cB1D2142A8",
      ultToken: "0x9C6adb7DC4b27fbFe381D726606248Ad258F4228" // New ULT token
    },
    50312: { // Somnia
      unityLedger: "0xC2E82087CEce1850ba3F10926Ff56f558B7E6Ad0", 
      ultToken: "0x2Da2331B2a0E669785e8EAAadc19e63e20E19E5f" // New ULT token
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