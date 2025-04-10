// scripts/deploy-ult.ts
import { ethers } from "hardhat";

async function main() {
  const ULTToken = await ethers.getContractFactory("ULTToken");
  const ultToken = await ULTToken.deploy();
  await ultToken.waitForDeployment();
  console.log("ULT Token deployed at:", ultToken.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
