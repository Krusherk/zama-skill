import { initSDK, createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk";

type VotingFrontendDeps = {
  signer: any;
  contract: any;
  contractAddress: string;
  userAddress: string;
};

export async function castConfidentialVote({ signer, contract, contractAddress, userAddress }: VotingFrontendDeps) {
  await initSDK();

  const instance = await createInstance({
    ...SepoliaConfig,
    network: (window as any).ethereum,
  });

  const encryptedVote = await instance.createEncryptedInput(contractAddress, userAddress).addBool(true).encrypt();

  const tx = await contract.confidentialVote(encryptedVote.handles[0], encryptedVote.inputProof);
  await tx.wait();

  const voteHandle = await contract.encryptedVoteOf(userAddress);

  const keypair = instance.generateKeypair();
  const startTimestamp = Math.floor(Date.now() / 1000).toString();
  const durationDays = "7";
  const eip712 = instance.createEIP712(
    keypair.publicKey,
    [contractAddress],
    startTimestamp,
    durationDays,
  );

  const signature = await signer.signTypedData(
    eip712.domain,
    { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
    eip712.message,
  );

  const decrypted = await instance.userDecrypt(
    [{ handle: voteHandle, contractAddress }],
    keypair.privateKey,
    keypair.publicKey,
    signature.replace("0x", ""),
    [contractAddress],
    userAddress,
    startTimestamp,
    durationDays,
  );

  return decrypted[voteHandle];
}

export async function finalizeVotingResult({ contract, contractAddress }: Omit<VotingFrontendDeps, "signer" | "userAddress">) {
  const instance = await createInstance({
    ...SepoliaConfig,
    network: (window as any).ethereum,
  });

  const [yesHandle, noHandle] = await contract.encryptedTotals();
  const results = await instance.publicDecrypt([yesHandle, noHandle]);

  const tx = await contract.finalizePublicResult(results.abiEncodedClearValues, results.decryptionProof);
  await tx.wait();

  return {
    yes: await contract.finalYesVotes(),
    no: await contract.finalNoVotes(),
  };
}
