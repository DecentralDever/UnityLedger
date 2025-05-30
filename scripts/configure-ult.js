// scripts/configure-ult.js
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  // Network-specific addresses
  const addresses = {
    4202: { // Lisk Sepolia
      unityLedger: "0x77039e3eB3c41c252Ee5ad699CFF80FcD19C2e0C",
      ultToken: "0xEE182471D7d6E9822936A223f18A6ac768846403" // New ULT token
    },
    50312: { // Somnia
      unityLedger: "0x5899ae510f1Ea8bf8Cf3A176EB3C7BA9582Ad974", 
      ultToken: "0xD8Ab46987e8732070dB487908E5BE39E3C34bb4C" // New ULT token
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