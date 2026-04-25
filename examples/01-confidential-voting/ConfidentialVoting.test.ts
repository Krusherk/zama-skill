import { time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";

describe("ConfidentialVoting", function () {
  let voting: any;
  let votingAddress: string;
  let deployer: any;
  let alice: any;
  let bob: any;

  before(async function () {
    [deployer, alice, bob] = await ethers.getSigners();
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      this.skip();
    }

    const factory = await ethers.getContractFactory("ConfidentialVoting");
    voting = await factory.deploy(3600, 60);
    votingAddress = await voting.getAddress();
  });

  it("stores private votes and finalizes a public result", async function () {
    const aliceVote = await fhevm.createEncryptedInput(votingAddress, alice.address).addBool(true).encrypt();
    await voting.connect(alice).confidentialVote(aliceVote.handles[0], aliceVote.inputProof);

    const bobVote = await fhevm.createEncryptedInput(votingAddress, bob.address).addBool(false).encrypt();
    await voting.connect(bob).confidentialVote(bobVote.handles[0], bobVote.inputProof);

    const aliceVoteHandle = await voting.encryptedVoteOf(alice.address);
    const bobVoteHandle = await voting.encryptedVoteOf(bob.address);

    expect(await fhevm.userDecryptEbool(aliceVoteHandle, votingAddress, alice)).to.equal(true);
    expect(await fhevm.userDecryptEbool(bobVoteHandle, votingAddress, bob)).to.equal(false);

    await time.increase(3600);
    await voting.scheduleResultPublication();
    await time.increase(61);
    await voting.requestPublicResult();

    const [yesHandle, noHandle] = await voting.encryptedTotals();
    const publicDecryptResults = await fhevm.publicDecrypt([yesHandle, noHandle]);

    await voting.finalizePublicResult(
      publicDecryptResults.abiEncodedClearValues,
      publicDecryptResults.decryptionProof,
    );

    expect(await voting.finalYesVotes()).to.equal(1n);
    expect(await voting.finalNoVotes()).to.equal(1n);
  });

  it("rejects a second vote from the same address", async function () {
    const encryptedVote = await fhevm.createEncryptedInput(votingAddress, alice.address).addBool(true).encrypt();

    await voting.connect(alice).confidentialVote(encryptedVote.handles[0], encryptedVote.inputProof);

    await expect(
      voting.connect(alice).confidentialVote(encryptedVote.handles[0], encryptedVote.inputProof),
    ).to.be.revertedWith("already voted");
  });
});
