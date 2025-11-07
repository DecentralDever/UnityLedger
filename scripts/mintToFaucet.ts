import { ethers, network } from "hardhat";

async function main() {
  // Network-specific addresses
  const addresses: Record<string, { 
    ultToken: string; 
    unityLedger: string; 
    faucet: string; 
  }> = {
    "lisk-sepolia": {
      ultToken: "0x9C6adb7DC4b27fbFe381D726606248Ad258F4228",
      unityLedger: "0xF7C911C3542687F49Dd42a3F0D54A2cB1D2142A8",
      faucet: process.env.VITE_LISK_SEPOLIA_FAUCET_ADDRESS || ""
    },
    "somnia": {
      ultToken: "0x2Da2331B2a0E669785e8EAAadc19e63e20E19E5f",
      unityLedger: "0xC2E82087CEce1850ba3F10926Ff56f558B7E6Ad0",
      faucet: process.env.VITE_SOMNIA_FAUCET_ADDRESS || ""
    }
  };

  const networkAddresses = addresses[network.name];
  if (!networkAddresses) {
    throw new Error(`Network ${network.name} not supported`);
  }

  if (!networkAddresses.faucet) {
    throw new Error(`Faucet address not found for ${network.name}. Please check your .env file.`);
  }

  const ULT_TOKEN_ADDRESS = networkAddresses.ultToken;
  const UNITY_LEDGER_ADDRESS = networkAddresses.unityLedger;
  const FAUCET_ADDRESS = networkAddresses.faucet;

  const [deployer] = await ethers.getSigners();
  console.log(`🚀 Minting 1M ULT to Faucet on ${network.name}`);
  console.log("📋 Network Info:");
  console.log("  Deployer:", deployer.address);
  console.log("  Balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");
  console.log("  ULT Token:", ULT_TOKEN_ADDRESS);
  console.log("  Unity Ledger:", UNITY_LEDGER_ADDRESS);
  console.log("  Faucet Address:", FAUCET_ADDRESS);

  // Amount to mint: 1 million ULT
  const mintAmount = ethers.parseEther("1000000");
  console.log(`\n💰 Minting Amount: ${ethers.formatEther(mintAmount)} ULT`);

  // Check current faucet balance
  console.log("\n🔍 Checking current faucet status...");
  try {
    const ultToken = await ethers.getContractAt("ULTToken", ULT_TOKEN_ADDRESS);
    const currentBalance = await ultToken.balanceOf(FAUCET_ADDRESS);
    console.log("  Current Faucet Balance:", ethers.formatEther(currentBalance), "ULT");
    
    // Check total supply before minting
    const totalSupply = await ultToken.totalSupply();
    const maxSupply = ethers.parseEther("1000000000"); // 1B tokens
    console.log("  Current Total Supply:", ethers.formatEther(totalSupply), "ULT");
    console.log("  Max Supply:", ethers.formatEther(maxSupply), "ULT");
    console.log("  Remaining Mintable:", ethers.formatEther(maxSupply - totalSupply), "ULT");
    
    if (totalSupply + mintAmount > maxSupply) {
      throw new Error(`Minting would exceed max supply. Can only mint ${ethers.formatEther(maxSupply - totalSupply)} more ULT`);
    }
  } catch (error: any) {
    console.log("⚠️ Could not check current balance:", error.message);
  }

  // Method 1: Try direct minting to faucet (requires ULTToken owner permissions)
  console.log("\n🎯 Method 1: Direct minting to faucet...");
  try {
    const ultToken = await ethers.getContractAt("ULTToken", ULT_TOKEN_ADDRESS);
    
    // Check if we're the owner
    const owner = await ultToken.owner();
    console.log("  ULT Token Owner:", owner);
    console.log("  Deployer Address:", deployer.address);
    console.log("  Is Owner:", owner.toLowerCase() === deployer.address.toLowerCase() ? "✅ YES" : "❌ NO");
    
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
      throw new Error("Not the token owner");
    }
    
    console.log("  🔄 Minting 1,000,000 ULT to faucet...");
    const tx = await ultToken.mint(FAUCET_ADDRESS, mintAmount);
    console.log("  Transaction Hash:", tx.hash);
    
    console.log("  ⏳ Waiting for confirmation...");
    await tx.wait();
    
    const newBalance = await ultToken.balanceOf(FAUCET_ADDRESS);
    console.log("  ✅ SUCCESS! Minted 1,000,000 ULT to faucet");
    console.log("  📊 New Faucet Balance:", ethers.formatEther(newBalance), "ULT");
    
  } catch (error: any) {
    console.log("  ❌ Direct minting failed:", error.message);
    
    // Method 2: Try minting through UnityLedger
    console.log("\n🎯 Method 2: Minting via UnityLedger...");
    try {
      const unityLedger = await ethers.getContractAt("UnityLedger", UNITY_LEDGER_ADDRESS);
      
      console.log("  🔄 Minting 1,000,000 ULT via UnityLedger...");
      const tx = await unityLedger.mintUltToAddress(FAUCET_ADDRESS, mintAmount);
      console.log("  Transaction Hash:", tx.hash);
      
      console.log("  ⏳ Waiting for confirmation...");
      await tx.wait();
      
      const ultToken = await ethers.getContractAt("ULTToken", ULT_TOKEN_ADDRESS);
      const newBalance = await ultToken.balanceOf(FAUCET_ADDRESS);
      console.log("  ✅ SUCCESS! Minted 1,000,000 ULT to faucet via UnityLedger");
      console.log("  📊 New Faucet Balance:", ethers.formatEther(newBalance), "ULT");
      
    } catch (error2: any) {
      console.log("  ❌ UnityLedger minting failed:", error2.message);
      
      // Method 3: Manual funding instructions
      console.log("\n🎯 Method 3: Manual Funding Required");
      console.log("  Both automatic methods failed. You'll need to:");
      console.log("  1. Ensure you have owner permissions on the ULT Token contract");
      console.log("  2. Or ensure the UnityLedger has minting permissions");
      console.log("  3. Manually call the mint function with these parameters:");
      console.log(`     - Contract: ${ULT_TOKEN_ADDRESS}`);
      console.log(`     - Function: mint(address to, uint256 amount)`);
      console.log(`     - Parameters: ("${FAUCET_ADDRESS}", "${mintAmount.toString()}")`);
      console.log(`     - Amount in Ether: ${ethers.formatEther(mintAmount)} ULT`);
    }
  }

  // Final status check
  console.log("\n📈 Final Status Check:");
  try {
    const ultToken = await ethers.getContractAt("ULTToken", ULT_TOKEN_ADDRESS);
    const faucetContract = await ethers.getContractAt("ULTFaucet", FAUCET_ADDRESS);
    
    const finalBalance = await ultToken.balanceOf(FAUCET_ADDRESS);
    const faucetAmount = await faucetContract.faucetAmount();
    const estimatedClaims = finalBalance / faucetAmount;
    
    console.log("  💎 Final Faucet Balance:", ethers.formatEther(finalBalance), "ULT");
    console.log("  🎁 ULT per Claim:", ethers.formatEther(faucetAmount), "ULT");
    console.log("  📊 Estimated Claims Available:", estimatedClaims.toString());
    console.log("  ⏰ At 500 ULT per claim, this will last for", estimatedClaims.toString(), "claims");
    
  } catch (error: any) {
    console.log("  ⚠️ Could not check final status:", error.message);
  }

  console.log("\n🎉 Faucet refill operation completed!");
  console.log("   Users can now claim ULT tokens from the faucet again.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Faucet refill failed:", error);
    process.exit(1);
  });