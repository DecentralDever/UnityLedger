import { ethers, network } from "hardhat";

async function main() {
  // Network-specific addresses - UPDATED WITH NEW ULT TOKENS
  const addresses: Record<string, { ultToken: string; unityLedger: string }> = {
    "lisk-sepolia": {
      ultToken: "0xEE182471D7d6E9822936A223f18A6ac768846403", // NEW ULT TOKEN
      unityLedger: "0x77039e3eB3c41c252Ee5ad699CFF80FcD19C2e0C"
    },
    "somnia": {
      ultToken: "0xD8Ab46987e8732070dB487908E5BE39E3C34bb4C", // NEW ULT TOKEN
      unityLedger: "0x5899ae510f1Ea8bf8Cf3A176EB3C7BA9582Ad974"
    }
  };

  const networkAddresses = addresses[network.name];
  if (!networkAddresses) {
    throw new Error(`Network ${network.name} not supported`);
  }

  const ULT_TOKEN_ADDRESS = networkAddresses.ultToken;
  const UNITY_LEDGER_ADDRESS = networkAddresses.unityLedger;

  const [deployer] = await ethers.getSigners();
  console.log(`Deploying ULT Faucet on ${network.name} with:`, deployer.address);
  console.log("Balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));
  console.log("ULT Token:", ULT_TOKEN_ADDRESS);
  console.log("Unity Ledger:", UNITY_LEDGER_ADDRESS);

  // Deploy Faucet
  console.log("\n🚀 Deploying ULT Faucet...");
  const ULTFaucet = await ethers.getContractFactory("ULTFaucet");
  const faucet = await ULTFaucet.deploy(ULT_TOKEN_ADDRESS);
  await faucet.waitForDeployment();
  
  const faucetAddress = await faucet.getAddress();
  console.log("✅ ULT Faucet deployed to:", faucetAddress);

  // Configure faucet
  console.log("\n⚙️ Configuring faucet...");
  await faucet.setFaucetAmount(ethers.parseEther("500")); // 500 ULT per claim
  await faucet.setCooldownPeriod(24 * 3600); // 24 hours
  await faucet.setMaxBalance(ethers.parseEther("2000")); // 2000 ULT max balance
  console.log("✅ Faucet configured");

  // Try to fund the faucet with ULT tokens
  console.log("\n💰 Attempting to fund faucet...");
  
  // First try: Direct minting from ULT token (if we have permission)
  try {
    const ultToken = await ethers.getContractAt("ULTToken", ULT_TOKEN_ADDRESS);
    const mintAmount = ethers.parseEther("100000");
    await ultToken.mint(faucetAddress, mintAmount);
    console.log("✅ Minted 100,000 ULT to faucet");
  } catch (error: any) {
    console.log("⚠️ Could not mint directly to faucet");
    
    // Second try: Mint through UnityLedger
    try {
      const unityLedger = await ethers.getContractAt("UnityLedger", UNITY_LEDGER_ADDRESS);
      const mintAmount = ethers.parseEther("100000");
      await unityLedger.mintUltToAddress(faucetAddress, mintAmount);
      console.log("✅ Minted 100,000 ULT to faucet via UnityLedger");
    } catch (error2: any) {
      console.log("⚠️ Could not mint via UnityLedger:", error2.message);
      console.log("   Please manually fund the faucet with ULT tokens");
    }
  }

  console.log("\n📋 Deployment Complete:");
  console.log("Network:", network.name);
  console.log("ULT Token:", ULT_TOKEN_ADDRESS);
  console.log("ULT Faucet:", faucetAddress);
  console.log("\n💡 Update .env:");
  console.log(`VITE_${network.name.toUpperCase().replace('-', '_')}_FAUCET_ADDRESS=${faucetAddress}`);
  
  // Verify the faucet has the correct token
  const faucetContract = await ethers.getContractAt("ULTFaucet", faucetAddress);
  const configuredToken = await faucetContract.ultToken();
  console.log("\n✅ Verification - Faucet ULT Token:", configuredToken);
  console.log("   Match:", configuredToken === ULT_TOKEN_ADDRESS ? "✅ YES" : "❌ NO");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deploy failed:", error);
    process.exit(1);
  });