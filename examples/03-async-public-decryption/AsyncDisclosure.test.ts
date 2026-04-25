import { time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";

describe("AsyncDisclosure", function () {
  let disclosure: any;
  let disclosureAddress: string;
  let owner: any;
  let alice: any;

  before(async function () {
    [owner, alice] = await ethers.getSigners();
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      this.skip();
    }

    const factory = await ethers.getContractFactory("AsyncDisclosure");
    disclosure = await factory.deploy(60, 1n, { value: ethers.parseEther("1") });
    disclosureAddress = await disclosure.getAddress();
  });

  it("runs the full async public-decryption flow and consumes the request", async function () {
    const encryptedValue = await fhevm.createEncryptedInput(disclosureAddress, owner.address).add64(42n).encrypt();

    await disclosure.connect(owner).setSealedValue(encryptedValue.handles[0], encryptedValue.inputProof);
    await disclosure.connect(owner).scheduleDisclosure();

    await time.increase(61);
    await disclosure.connect(alice).requestPublicDisclosure();

    const [handle, requester] = await disclosure.pendingDisclosure(1n);
    expect(requester).to.equal(alice.address);

    const publicDecryptResults = await fhevm.publicDecrypt([handle]);
    const aliceBalanceBefore = await ethers.provider.getBalance(alice.address);

    await disclosure
      .connect(owner)
      .finalizePublicDisclosure(1n, publicDecryptResults.abiEncodedClearValues, publicDecryptResults.decryptionProof);

    const aliceBalanceAfter = await ethers.provider.getBalance(alice.address);

    expect(await disclosure.lastDisclosedValue()).to.equal(42n);
    expect(await disclosure.lastRequester()).to.equal(alice.address);
    expect(aliceBalanceAfter - aliceBalanceBefore).to.equal(1n);

    await expect(
      disclosure
        .connect(owner)
        .finalizePublicDisclosure(1n, publicDecryptResults.abiEncodedClearValues, publicDecryptResults.decryptionProof),
    ).to.be.revertedWith("invalid request");
  });
});
