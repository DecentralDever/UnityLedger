import { ethers, network } from "hardhat";
import { expect } from "chai";

describe("UnityLedger", function () {
  let unityLedger: any;
  let owner: any, member1: any, member2: any, member3: any;

  beforeEach(async function () {
    [owner, member1, member2, member3] = await ethers.getSigners();
    const Contract = await ethers.getContractFactory("UnityLedger");
    unityLedger = await Contract.deploy();
    await unityLedger.waitForDeployment();
  });

  it("should create a pool", async function () {
    const payoutOrder = [member1.address, member2.address, member3.address];
    await unityLedger.createPool(ethers.parseEther("1"), 60, 3, payoutOrder);

    const poolId = await unityLedger.nextPoolId();
    expect(poolId).to.equal(1);
  });

  it("should allow users to join a pool", async function () {
    const payoutOrder = [member1.address, member2.address, member3.address];
    await unityLedger.createPool(ethers.parseEther("1"), 60, 3, payoutOrder);

    await unityLedger.connect(member1).joinPool(0);
    await unityLedger.connect(member2).joinPool(0);

    const members = await unityLedger.getPoolMembers(0);
    expect(members.length).to.equal(2);
    expect(members[0].wallet).to.equal(member1.address);
  });

  it("should accept contributions and trigger payout when complete", async function () {
    const payoutOrder = [member1.address, member2.address, member3.address];
    await unityLedger.createPool(ethers.parseEther("1"), 1, 3, payoutOrder);
    await unityLedger.connect(member1).joinPool(0);
    await unityLedger.connect(member2).joinPool(0);
    await unityLedger.connect(member3).joinPool(0);

    await network.provider.send("evm_increaseTime", [61]);
    await network.provider.send("evm_mine");

    await unityLedger.connect(member1).contribute(0, { value: ethers.parseEther("1") });
    await unityLedger.connect(member2).contribute(0, { value: ethers.parseEther("1") });
    const tx = await unityLedger.connect(member3).contribute(0, { value: ethers.parseEther("1") });
    await tx.wait();

    const payout = await unityLedger.payoutHistory(0);
    expect(payout).to.equal(member1.address);
  });

  it("should blacklist members after 3 missed contributions", async function () {
    const payoutOrder = [member1.address, member2.address, member3.address];
    await unityLedger.createPool(ethers.parseEther("1"), 1, 3, payoutOrder);
    await unityLedger.connect(member1).joinPool(0);
    await unityLedger.connect(member2).joinPool(0);
    await unityLedger.connect(member3).joinPool(0);

    for (let i = 0; i < 3; i++) {
      await unityLedger.connect(member1).contribute(0, { value: ethers.parseEther("1") });
      await unityLedger.connect(member2).contribute(0, { value: ethers.parseEther("1") });

      await network.provider.send("evm_increaseTime", [61]);
      await network.provider.send("evm_mine");

      await unityLedger.startNewCycle(0);
    }

    const isBlacklisted = await unityLedger.isBlacklisted(member3.address);
    expect(isBlacklisted).to.equal(true);
  });
});
