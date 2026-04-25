import { initSDK, createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk";

type TokenFrontendDeps = {
  signer: any;
  contract: any;
  contractAddress: string;
  userAddress: string;
  recipient: string;
};

export async function transferConfidentialBalance({
  signer,
  contract,
  contractAddress,
  userAddress,
  recipient,
}: TokenFrontendDeps) {
  await initSDK();

  const instance = await createInstance({
    ...SepoliaConfig,
    network: (window as any).ethereum,
  });

  const encryptedAmount = await instance.createEncryptedInput(contractAddress, userAddress).add64(25n).encrypt();

  const tx = await contract.confidentialTransfer(recipient, encryptedAmount.handles[0], encryptedAmount.inputProof);
  await tx.wait();

  const balanceHandle = await contract.confidentialBalanceOf(userAddress);

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
    [{ handle: balanceHandle, contractAddress }],
    keypair.privateKey,
    keypair.publicKey,
    signature.replace("0x", ""),
    [contractAddress],
    userAddress,
    startTimestamp,
    durationDays,
  );

  return decrypted[balanceHandle];
}
