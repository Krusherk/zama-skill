# Frontend, Testing, And Deployment

Use this file when the task needs an end-to-end development workflow: frontend encryption/decryption, Hardhat tests, or deployment runbooks.

As of April 25, 2026, the official Zama Protocol docs say:

- real FHEVM validation is currently available on Ethereum Sepolia
- the host-chain `chainId` is `11155111`
- the relayer/gateway infrastructure is separate, and app developers only need a wallet on the FHEVM host chain for normal dapp work

## Frontend integration rules

- If the repo already uses `@zama-fhe/relayer-sdk`, stay consistent.
- If the repo already uses `@fhevm/sdk`, stay consistent.
- If the prompt says `fhevmjs`, interpret that as the frontend FHEVM JavaScript SDK layer and use the repo’s existing SDK or the current official relayer flow for greenfield code.
- Encrypt for the target contract address and the direct caller address.
- Batch encrypted inputs when it makes sense and reuse the shared proof.
- Remember the current aggregate bit-size limit for a batch is constrained; do not assume unbounded packing.

## Hardhat template bootstrap

For a fresh project:

```bash
npm install
npx hardhat vars set MNEMONIC
npx hardhat vars set INFURA_API_KEY
npx hardhat vars set ETHERSCAN_API_KEY
npm run compile
npm run test
```

## Wallet creation and funding

### Which wallet the agent should use

- `hardhat` and `localhost`: use the built-in Hardhat accounts by default
- `sepolia`: use a dedicated throwaway deployer wallet

Do not use a personal main wallet for agent-driven testnet deployments.

### Safe wallet creation flow

If the repo already has a deployment mnemonic, use it.

If it does not, generate a fresh local wallet and then store the mnemonic in local secrets only:

```bash
node -e 'const { Wallet } = require("ethers"); const w = Wallet.createRandom(); console.log("ADDRESS=" + w.address); console.log("MNEMONIC=" + w.mnemonic.phrase);'
npx hardhat vars set MNEMONIC
```

Then configure RPC access:

```bash
npx hardhat vars set INFURA_API_KEY
```

Optional contract verification:

```bash
npx hardhat vars set ETHERSCAN_API_KEY
```

### Funding rules

- For local mock networks, no external funding is needed.
- For Sepolia deployments, the wallet needs Sepolia ETH.
- A normal FHEVM contract deployment does not require `$ZAMA` tokens.
- If the environment has an approved faucet automation path, the agent may use it.
- Otherwise, the agent should present the deployer address and ask the human to fund it with Sepolia ETH.

## Local development loop

```bash
npx hardhat node
npx hardhat deploy --network localhost
npx hardhat test
```

## Sepolia flow

```bash
npx hardhat deploy --network sepolia
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
npx hardhat test --network sepolia
```

Use Sepolia for final validation of real encryption and deployment assumptions, not as the fastest feedback loop.

## Agent deployment decision tree

1. If the task is local testing, use `hardhat` or `localhost` and default Hardhat accounts.
2. If the task is real encrypted validation or reviewer-facing deployment, use `sepolia`.
3. Before Sepolia deploy:
   - ensure mnemonic exists
   - ensure RPC credentials exist
   - ensure wallet has Sepolia ETH
   - run compile and tests
4. After deployment:
   - report contract address
   - report verification command if applicable
   - report frontend contract-address binding point

## Relayer SDK flow

```ts
import { initSDK, createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk";

await initSDK();

const instance = await createInstance({
  ...SepoliaConfig,
  network: window.ethereum,
});

const input = instance.createEncryptedInput(contractAddress, userAddress);
input.add64(42n);
const encrypted = await input.encrypt();
```

For user decryption:

```ts
const keypair = instance.generateKeypair();
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
```

For public decryption:

```ts
const result = await instance.publicDecrypt([handle]);
```

## `@fhevm/sdk` flow

```ts
import { createFhevmClient, setFhevmRuntimeConfig } from "@fhevm/sdk/ethers";
import { sepolia } from "@fhevm/sdk/chains";

setFhevmRuntimeConfig({ numberOfThreads: 4 });
const client = createFhevmClient({ chain: sepolia, provider });
```

Use this family only when the repo already uses it or the project explicitly standardizes on it.

## Testing rules

- Use the Hardhat plugin runtime in tests.
- Guard mock-only tests with `if (!fhevm.isMock) this.skip();`
- Decrypt with the correct function:
  - `fhevm.userDecryptEuint(...)`
  - `fhevm.userDecryptEbool(...)`
  - `fhevm.userDecryptEaddress(...)`
- Do not assert correctness solely from raw handle equality.
- For public decryption tests, use `fhevm.publicDecrypt(...)` to obtain ABI-encoded clear values plus proof.

## What “tested and validated” should mean for this bounty

The agent should be able to:

- generate a contract
- generate tests
- compile the contract
- run the tests
- deploy to localhost
- explain the frontend encryption path

For final reviewer confidence, validate at least one path on Sepolia if credentials are available.
