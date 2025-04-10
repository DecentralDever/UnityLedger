import { ethers } from "hardhat";

async function main() {
  // Get the contract factory for UnityLedger
  const UnityLedgerFactory = await ethers.getContractFactory("UnityLedger");

  // Deploy the contract
  const contract = await UnityLedgerFactory.deploy();

  // Wait until the deployment is mined
  await contract.waitForDeployment();

  console.log(`✅ Contract deployed at: ${contract.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
