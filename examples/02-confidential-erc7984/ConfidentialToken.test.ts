import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("ConfidentialToken", function () {
  let token: any;
  let tokenAddress: string;
  let owner: any;
  let alice: any;
  let bob: any;

  before(async function () {
    [owner, alice, bob] = await ethers.getSigners();
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      this.skip();
    }

    const factory = await ethers.getContractFactory("ConfidentialToken");
    token = await factory.deploy(owner.address);
    tokenAddress = await token.getAddress();
  });

  it("mints privately and transfers confidential balances", async function () {
    const encryptedMint = await fhevm.createEncryptedInput(tokenAddress, owner.address).add64(100n).encrypt();

    await token
      .connect(owner)
      ["confidentialMint(address,bytes32,bytes)"](alice.address, encryptedMint.handles[0], encryptedMint.inputProof);

    let aliceBalanceHandle = await token.confidentialBalanceOf(alice.address);
    expect(await fhevm.userDecryptEuint(FhevmType.euint64, aliceBalanceHandle, tokenAddress, alice)).to.equal(100n);

    const encryptedTransfer = await fhevm.createEncryptedInput(tokenAddress, alice.address).add64(40n).encrypt();

    await token
      .connect(alice)
      ["confidentialTransfer(address,bytes32,bytes)"](bob.address, encryptedTransfer.handles[0], encryptedTransfer.inputProof);

    aliceBalanceHandle = await token.confidentialBalanceOf(alice.address);
    const bobBalanceHandle = await token.confidentialBalanceOf(bob.address);

    expect(await fhevm.userDecryptEuint(FhevmType.euint64, aliceBalanceHandle, tokenAddress, alice)).to.equal(60n);
    expect(await fhevm.userDecryptEuint(FhevmType.euint64, bobBalanceHandle, tokenAddress, bob)).to.equal(40n);
  });
});
