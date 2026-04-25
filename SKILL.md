---
name: zama-fhevm
description: Use when building, reviewing, testing, deploying, or integrating confidential smart contracts on Zama Protocol / FHEVM, including Hardhat setup, encrypted types and operations, ACL, encrypted inputs, async decryption, frontend SDK usage, and OpenZeppelin ERC-7984 confidential token patterns.
when_to_use: Trigger for prompts like "Write me a confidential voting contract using FHEVM", "How do I build a confidential ERC-7984 token?", "Add FHEVM frontend integration", "How does fhevmjs work here?", "Implement public decryption", "Test this FHEVM contract", or "Audit this FHEVM contract".
---

# Zama FHEVM

Use this skill whenever the task involves Zama Protocol, FHEVM, encrypted Solidity types, confidential smart contracts, ERC-7984, confidential wrappers, encrypted inputs, user decryption, public decryption, or frontend encryption/decryption flows.

## Mission, tool compatibility, and source-of-truth priority

- This skill is written as a long-form, self-sufficient agent playbook so the model can build working FHEVM code without interrupting the task to rediscover basics.
- Primary native target: Claude Code `SKILL.md` skills. The structure is also portable to other skill-style agent tools that understand `SKILL.md` plus supporting files.
- Prefer the repo’s existing conventions if the repository already compiles and uses a specific FHEVM stack. Otherwise, default to the official Hardhat template and current `FHE` APIs.
- Load support files only when they help the current task:
  - architecture and execution model: `references/01-mental-model.md`
  - type matrix and operation details: `references/02-encrypted-types-and-ops.md`
  - ACL, proofs, and caller-binding rules: `references/03-acl-and-input-proofs.md`
  - user/public decryption: `references/04-decryption-patterns.md`
  - frontend, testing, and deployment: `references/05-frontend-testing-and-deployment.md`
  - OpenZeppelin token/wrapper guidance: `references/06-openzeppelin-erc7984.md`
  - final review pass: `references/07-anti-patterns-and-security-checklist.md`
- When you need concrete starting points instead of prose, use the shipped examples:
  - confidential voting: `examples/01-confidential-voting`
  - confidential ERC-7984 token: `examples/02-confidential-erc7984`
  - async public decryption: `examples/03-async-public-decryption`
- When sources disagree, prefer them in this order:
  1. Current code in `zama-ai/fhevm` and `zama-ai/fhevm-hardhat-template`
  2. Current code in `OpenZeppelin/openzeppelin-confidential-contracts`
  3. Current docs on `docs.zama.org/protocol`
  4. OpenZeppelin’s FHEVM security article for threat-model and anti-pattern guidance

## Agent defaults

- Prefer the current Solidity stack used by the official Hardhat template:
  - `@fhevm/solidity`
  - `@fhevm/hardhat-plugin`
  - `ZamaEthereumConfig`
- As of April 25, 2026, the official Zama Protocol docs say the current real-encryption deployment target is Ethereum Sepolia.
- Treat networks this way by default:
  - `hardhat`: fastest mock-runtime testing
  - `localhost`: persistent mock-runtime testing and frontend integration
  - `sepolia` (`chainId 11155111`): real FHEVM validation and real deployments
- The app contract is deployed on the FHEVM host chain, which is currently Sepolia. The Gateway/relayer side is separate and should be treated as protocol infrastructure, not the chain where the app contract gets deployed.
- Use `FHE`, not legacy `TFHE`, unless the repo already uses legacy APIs and already builds.
- For frontend code:
  - If the repo already uses `@zama-fhe/relayer-sdk` or the official docs/template patterns, stay consistent.
  - If the repo already uses `@fhevm/sdk`, stay consistent with that newer SDK.
  - If the prompt says `fhevmjs`, treat it as the frontend encryption/decryption layer in general; do not invent package names or APIs.
- Start new projects from `zama-ai/fhevm-hardhat-template` unless the repo already has a working FHEVM setup.
- Prefer OpenZeppelin confidential contracts for confidential fungible tokens and wrappers instead of hand-rolling ERC-7984.

## Bootstrap checklist

For a fresh Hardhat project, default to:

```bash
npm install
npx hardhat vars set MNEMONIC
npx hardhat vars set INFURA_API_KEY
npm run compile
npm run test
```

### Wallet creation and funding rules

- For local `hardhat` and `localhost` work, use the built-in Hardhat accounts. Do not create a new wallet unless the task explicitly needs a separate signer.
- For Sepolia deployments, use a dedicated throwaway deployer wallet, not a personal main wallet.
- If the repo already has a valid `MNEMONIC` or deployment wallet convention, follow it.
- If no wallet exists, the agent may generate a fresh deployer wallet locally, then immediately store its mnemonic outside source control and configure Hardhat to use it.
- Never commit mnemonics, private keys, `.env` secrets, or generated wallet artifacts.
- For a new wallet, Sepolia ETH is required for deployments. A normal confidential-app deployment does not require `$ZAMA` tokens.
- If the environment has an approved automated faucet flow, the agent may use it. Otherwise, the agent should surface the new wallet address and ask the human to fund it with Sepolia ETH.

Example wallet generation flow when `ethers` is available locally:

```bash
node -e 'const { Wallet } = require("ethers"); const w = Wallet.createRandom(); console.log("ADDRESS=" + w.address); console.log("MNEMONIC=" + w.mnemonic.phrase);'
npx hardhat vars set MNEMONIC
```

After the mnemonic is configured, set RPC credentials:

```bash
npx hardhat vars set INFURA_API_KEY
```

Use these imports by default:

```solidity
pragma solidity ^0.8.27;

import {FHE, ebool, eaddress, euint8, euint16, euint32, euint64, euint128, euint256, externalEbool, externalEaddress, externalEuint8, externalEuint16, externalEuint32, externalEuint64, externalEuint128, externalEuint256} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
```

## Mental model

- On-chain contracts do not hold plaintext. They hold ciphertext handles (`bytes32` under the hood).
- FHE operations are symbolically emitted on-chain and executed off-chain by coprocessors. The blockchain sees handles, not decrypted values.
- The ACL contract is the on-chain authority for who may use or decrypt each ciphertext handle.
- Secret-dependent failure cannot use ordinary `require`/`revert`, because revealing whether a secret predicate was true leaks information.
- Public validation may still revert:
  - invalid `FHE.fromExternal(...)` proof
  - invalid `FHE.checkSignatures(...)` proof
  - ordinary public conditions like time windows, roles, zero addresses, operator approval

### Rule: never branch on encrypted data with `if`, `require`, or `revert`

Wrong:

```solidity
function bid(euint64 amount) external {
    ebool isHigher = FHE.gt(amount, highestBid);
    require(ebool.unwrap(isHigher) != 0, "not higher");
    highestBid = amount;
}
```

Right:

```solidity
function bid(euint64 amount) external {
    ebool isHigher = FHE.gt(amount, highestBid);
    euint64 nextHighestBid = FHE.select(isHigher, amount, highestBid);
    highestBid = nextHighestBid;
    FHE.allowThis(nextHighestBid);
}
```

### Rule: encrypted execution silently chooses safe fallbacks instead of reverting on secret predicates

Wrong:

```solidity
function mint(euint64 amount) external {
    euint64 nextSupply = FHE.add(totalSupply, amount);
    totalSupply = nextSupply; // assumes add will revert on overflow
}
```

Right:

```solidity
function mint(euint64 amount) external {
    euint64 tentative = FHE.add(totalSupply, amount);
    ebool overflow = FHE.lt(tentative, totalSupply);
    euint64 nextSupply = FHE.select(overflow, totalSupply, tentative);
    totalSupply = nextSupply;
    FHE.allowThis(nextSupply);
}
```

### Rule: every newly created handle that the contract will reuse later must be re-authorized to `address(this)`

Wrong:

```solidity
function increment(externalEuint32 encryptedAmount, bytes calldata inputProof) external {
    euint32 amount = FHE.fromExternal(encryptedAmount, inputProof);
    count = FHE.add(count, amount);
}
```

Right:

```solidity
function increment(externalEuint32 encryptedAmount, bytes calldata inputProof) external {
    euint32 amount = FHE.fromExternal(encryptedAmount, inputProof);
    euint32 nextCount = FHE.add(count, amount);
    count = nextCount;
    FHE.allowThis(nextCount);
    FHE.allow(nextCount, msg.sender);
}
```

## Encrypted types and type selection

Use the smallest type that safely fits the domain. HCU cost rises with bit width, and scalar operations are cheaper than ciphertext-vs-ciphertext operations.

| Type | Bits | Use it for | Important limits | Cost guidance |
| --- | --- | --- | --- | --- |
| `ebool` | 2 | encrypted flags and comparisons | no normal Solidity branching | cheap; `select` is still meaningful work |
| `euint8` | 8 | small counters, enums, percentages | wraps on overflow | cheapest arithmetic tier |
| `euint16` | 16 | bounded IDs, small supplies | wraps on overflow | modestly higher than `euint8` |
| `euint32` | 32 | counters, timestamps, bounded math | wraps on overflow | solid default for moderate ranges |
| `euint64` | 64 | token amounts, balances, bids | wraps on overflow | common confidential-finance default |
| `euint128` | 128 | larger ranges when `euint64` is unsafe | wraps on overflow | significantly more expensive than `euint64` |
| `eaddress` (`euint160`) | 160 | encrypted addresses only | supports only `eq`, `ne`, `select` | more expensive than smaller integers |
| `euint256` | 256 | 256-bit bitwise/comparison use-cases | no `add/sub/mul/div/rem/min/max/gt/ge/lt/le` | expensive; avoid unless truly required |

Approximate HCU trends from current docs:

- Scalar `add`: `euint8` 84k, `euint64` 133k, `euint128` 172k
- Scalar `mul`: `euint8` 122k, `euint64` 365k, `euint128` 696k
- `select`: `ebool/euint8/euint16/euint32/euint64` about 55k, `euint128` about 57k, `eaddress` about 83k, `euint256` about 108k
- Transaction limits: about `20,000,000` global HCU and `5,000,000` depth per transaction in the current devnet docs

### Type support summary

- `ebool`: `and`, `or`, `xor`, `eq`, `ne`, `not`, `select`, `rand`
- `euint8/euint16/euint32/euint64/euint128`: `add`, `sub`, `mul`, `div` (plaintext divisor only), `rem` (plaintext divisor only), `neg`, `min`, `max`, `and`, `or`, `xor`, `not`, `shl`, `shr`, `rotl`, `rotr`, `eq`, `ne`, `ge`, `gt`, `le`, `lt`, `select`, `rand`
- `eaddress`: `eq`, `ne`, `select`
- `euint256`: `and`, `or`, `xor`, `not`, `neg`, `shl`, `shr`, `rotl`, `rotr`, `eq`, `ne`, `select`, `rand`

### Rule: default to `euint64` for confidential token amounts and bids, not `euint256`

Wrong:

```solidity
euint256 private balance;
euint256 private bidAmount;
```

Right:

```solidity
euint64 private balance;
euint64 private bidAmount;
```

### Rule: use `eaddress` only for encrypted addresses, not general integer math

Wrong:

```solidity
euint64 private ownerLikeValue;
ownerLikeValue = FHE.asEuint64(uint64(uint160(msg.sender))); // loses address semantics
```

Right:

```solidity
eaddress private ownerCipher;
ownerCipher = FHE.asEaddress(msg.sender);
FHE.allowThis(ownerCipher);
```

## FHE operation reference

Use these APIs exactly. Do not invent variants.

### Casting and input conversion

```solidity
FHE.asEbool(true)
FHE.asEuint8(1)
FHE.asEuint16(2)
FHE.asEuint32(3)
FHE.asEuint64(4)
FHE.asEuint128(5)
FHE.asEuint256(6)
FHE.asEaddress(msg.sender)

FHE.fromExternal(externalEboolValue, inputProof)
FHE.fromExternal(externalEuint64Value, inputProof)
FHE.fromExternal(externalEaddressValue, inputProof)
```

### Arithmetic

```solidity
FHE.add(a, b)
FHE.add(a, 1)
FHE.sub(a, b)
FHE.sub(a, 1)
FHE.mul(a, b)
FHE.mul(a, 10)
FHE.div(a, 10)   // rhs must be plaintext
FHE.rem(a, 10)   // rhs must be plaintext
FHE.neg(a)
FHE.min(a, b)
FHE.max(a, b)
```

### Bitwise and shifts

```solidity
FHE.and(a, b)
FHE.or(a, b)
FHE.xor(a, b)
FHE.not(a)
FHE.shl(a, uint8(3))
FHE.shr(a, uint8(3))
FHE.rotl(a, uint8(3))
FHE.rotr(a, uint8(3))
```

### Comparisons and ternary

```solidity
FHE.eq(a, b)
FHE.ne(a, b)
FHE.ge(a, b)
FHE.gt(a, b)
FHE.le(a, b)
FHE.lt(a, b)
FHE.select(cond, whenTrue, whenFalse)
```

### Random generation

```solidity
FHE.randEbool()
FHE.randEuint8()
FHE.randEuint64()
FHE.randEuint64(100) // bounded
```

### Handle conversion for decryption proof verification

```solidity
bytes32 handle = FHE.toBytes32(value);
```

### Operation rules

- Prefer scalar rhs overloads when possible (`FHE.add(balance, 1)` is cheaper than `FHE.add(balance, FHE.asEuint64(1))`).
- `div` and `rem` only support plaintext rhs today.
- Shift amounts are taken modulo the lhs bit width.
- `euint256` is not a drop-in replacement for smaller arithmetic types.

## ACL rules

Treat ACL design as part of the contract’s correctness.

- `FHE.allowThis(handle)`: persistent contract self-access for future transactions
- `FHE.allow(handle, account)`: persistent access for another account or contract
- `FHE.allowTransient(handle, account)`: current-transaction-only access
- `FHE.isSenderAllowed(handle)`: check `msg.sender` authorization on a direct ciphertext handle
- `FHE.isAllowed(handle, account)`: equivalent explicit form
- `FHE.makePubliclyDecryptable(handle)`: permanent global public decryption permission

### Rule: use `allowTransient` for same-transaction helper calls; use `allow` only when the callee must keep access across transactions

Wrong:

```solidity
function quoteFee(euint64 amount) external returns (euint64) {
    FHE.allow(amount, address(feeHandler));
    return feeHandler.calculateFee(amount);
}
```

Right:

```solidity
function quoteFee(euint64 amount) external returns (euint64) {
    require(FHE.isSenderAllowed(amount), "sender not allowed");
    FHE.allowTransient(amount, address(feeHandler));
    return feeHandler.calculateFee(amount);
}
```

### Rule: every external/public function that accepts a direct ciphertext handle (`euintX`, `ebool`, `eaddress`) must verify caller permission before using it

Wrong:

```solidity
function calculateFee(euint64 amount) external returns (euint64) {
    euint64 fee = FHE.div(FHE.mul(amount, 10), 10_000);
    FHE.allow(fee, msg.sender);
    return fee;
}
```

Right:

```solidity
function calculateFee(euint64 amount) external returns (euint64) {
    require(FHE.isSenderAllowed(amount), "sender not allowed");
    euint64 fee = FHE.div(FHE.mul(amount, 10), 10_000);
    FHE.allow(fee, msg.sender);
    FHE.allowThis(fee);
    return fee;
}
```

### Rule: for fresh user inputs, accept `externalE*` plus `inputProof` and validate with `FHE.fromExternal`; do not call `isSenderAllowed` on `externalE*`

Wrong:

```solidity
function deposit(euint64 amount) external {
    require(FHE.isSenderAllowed(amount), "not allowed");
    balances[msg.sender] = FHE.add(balances[msg.sender], amount);
}
```

Right:

```solidity
function deposit(externalEuint64 encryptedAmount, bytes calldata inputProof) external {
    euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
    euint64 newBalance = FHE.add(balances[msg.sender], amount);
    balances[msg.sender] = newBalance;
    FHE.allowThis(newBalance);
    FHE.allow(newBalance, msg.sender);
}
```

### Rule: grant the minimum persistent audience only

Wrong:

```solidity
function saveBid(euint64 bid) internal {
    highestBid = bid;
    FHE.allowThis(highestBid);
    FHE.allow(highestBid, tx.origin);
    FHE.allow(highestBid, msg.sender);
    FHE.makePubliclyDecryptable(highestBid);
}
```

Right:

```solidity
function saveBid(euint64 bid) internal {
    highestBid = bid;
    FHE.allowThis(highestBid);
}
```

### Rule: if a user must later decrypt a stored value, grant both persistent contract access and persistent user access

Wrong:

```solidity
function updatePrivateBalance(euint64 newBalance) internal {
    balances[msg.sender] = newBalance;
    FHE.allow(newBalance, msg.sender); // contract cannot reliably reuse later
}
```

Right:

```solidity
function updatePrivateBalance(euint64 newBalance) internal {
    balances[msg.sender] = newBalance;
    FHE.allowThis(newBalance);
    FHE.allow(newBalance, msg.sender);
}
```

## Encrypted inputs and proofs

- Fresh encrypted calldata should be `externalEbool`, `externalEaddress`, or `externalEuint*` plus a shared `bytes inputProof`.
- The off-chain tuple is bound to:
  - target contract address
  - caller address
- Multiple encrypted values can share one proof.
- The order of values when encrypting off-chain does not need to match Solidity argument order, but each handle index must map to the correct value and proof.

### Rule: never invent old overloads like `FHE.asEuint64(encryptedAmount, inputProof)` in new code; use `FHE.fromExternal`

Wrong:

```solidity
function vote(externalEuint8 encryptedChoice, bytes calldata inputProof) external {
    euint8 choice = FHE.asEuint8(encryptedChoice, inputProof);
    currentVote = choice;
}
```

Right:

```solidity
function vote(externalEuint8 encryptedChoice, bytes calldata inputProof) external {
    euint8 choice = FHE.fromExternal(encryptedChoice, inputProof);
    currentVote = choice;
    FHE.allowThis(choice);
}
```

### Rule: do not encrypt for a third-party caller context unless that intermediate contract validates and re-binds the value

Wrong:

```solidity
function executeQueuedTransfer(
    address token,
    address to,
    externalEuint64 encryptedAmount,
    bytes calldata inputProof
) external {
    IERC7984(token).confidentialTransferFrom(address(this), to, encryptedAmount, inputProof);
}
```

Right:

```solidity
function executeQueuedTransfer(
    IERC7984 token,
    address from,
    address to,
    externalEuint64 encryptedAmount,
    bytes calldata inputProof
) external {
    euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
    FHE.allowTransient(amount, address(token));
    token.confidentialTransferFrom(from, to, amount);
}
```

## Silent failure patterns and arithmetic guards

Secret-dependent failure should degrade into an encrypted safe fallback.

### Rule: encrypted arithmetic wraps; protect critical arithmetic with encrypted guards and `FHE.select`

Wrong:

```solidity
function chargeFee(euint64 amount) internal returns (euint64) {
    return FHE.div(FHE.mul(amount, FEE_BPS), 10_000);
}
```

Right:

```solidity
function chargeFee(euint64 amount) internal returns (euint64) {
    ebool overflow = FHE.gt(amount, type(uint64).max / FEE_BPS);
    euint64 cappedAmount = FHE.select(overflow, FHE.asEuint64(type(uint64).max / FEE_BPS), amount);
    return FHE.div(FHE.mul(cappedAmount, FEE_BPS), 10_000);
}
```

### Rule: for `euint64` accounting, prefer OpenZeppelin `FHESafeMath` when available

Wrong:

```solidity
function debit(address from, euint64 amount) internal {
    balances[from] = FHE.sub(balances[from], amount);
}
```

Right:

```solidity
function debit(address from, euint64 amount) internal {
    (ebool success, euint64 updated) = FHESafeMath.tryDecrease(balances[from], amount);
    balances[from] = updated;
    FHE.allowThis(updated);
    FHE.allow(updated, from);
    FHE.allowThis(success);
}
```

### Rule: when interacting with confidential tokens or wrappers, use the effective transferred amount, not the requested amount

Wrong:

```solidity
function bid(externalEuint64 encryptedAmount, bytes calldata inputProof) external {
    euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
    token.confidentialTransferFrom(msg.sender, address(this), amount);
    ebool isHigher = FHE.gt(amount, highestBid);
    highestBid = FHE.select(isHigher, amount, highestBid);
}
```

Right:

```solidity
function bid(externalEuint64 encryptedAmount, bytes calldata inputProof) external {
    euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
    FHE.allowTransient(amount, address(token));
    euint64 transferred = token.confidentialTransferFrom(msg.sender, address(this), amount);
    ebool hasTransferred = FHE.gt(transferred, FHE.asEuint64(0));
    ebool isHigher = FHE.gt(transferred, highestBid);
    ebool isBestBid = FHE.and(hasTransferred, isHigher);
    euint64 nextHighestBid = FHE.select(isBestBid, transferred, highestBid);
    highestBid = nextHighestBid;
    FHE.allowThis(nextHighestBid);
}
```

### Rule: explicitly detect zero-transfer no-ops when business logic assumes value moved

Wrong:

```solidity
escrowed[msg.sender] = FHE.add(escrowed[msg.sender], requestedAmount);
```

Right:

```solidity
ebool movedValue = FHE.gt(transferredAmount, FHE.asEuint64(0));
euint64 nextEscrow = FHE.add(escrowed[msg.sender], transferredAmount);
escrowed[msg.sender] = FHE.select(movedValue, nextEscrow, escrowed[msg.sender]);
FHE.allowThis(escrowed[msg.sender]);
FHE.allow(escrowed[msg.sender], msg.sender);
```

## Async decryption patterns

There are two distinct flows:

- User decryption: off-chain private re-encryption for an authorized user; no on-chain callback
- Public decryption: on-chain/off-chain/on-chain async flow with `makePubliclyDecryptable` and `checkSignatures`

### Public decryption: canonical two-step flow

1. Contract marks final ciphertext(s) publicly decryptable and emits a request event.
2. Off-chain client/relayer gets clear values and decryption proof.
3. Contract finalizes by verifying proof with `FHE.checkSignatures`.

### Rule: verify exactly the same ordered handle list and ABI-encoded cleartext sequence that the proof was built for

Wrong:

```solidity
function finalize(bool clearFoo, uint8 clearBar, bytes calldata proof) external {
    bytes32[] memory handles = new bytes32[](2);
    handles[0] = FHE.toBytes32(encryptedBar);
    handles[1] = FHE.toBytes32(encryptedFoo);
    FHE.checkSignatures(handles, abi.encode(clearFoo, clearBar), proof);
}
```

Right:

```solidity
function finalize(bool clearFoo, uint8 clearBar, bytes calldata proof) external {
    bytes32[] memory handles = new bytes32[](2);
    handles[0] = FHE.toBytes32(encryptedFoo);
    handles[1] = FHE.toBytes32(encryptedBar);
    FHE.checkSignatures(handles, abi.encode(clearFoo, clearBar), proof);
}
```

### Rule: consume async state before external calls or value transfers

Wrong:

```solidity
function finalizeUnwrap(bytes32 requestId, uint64 clearAmount, bytes calldata proof) external {
    bytes32[] memory handles = new bytes32[](1);
    handles[0] = requestId;
    FHE.checkSignatures(handles, abi.encode(clearAmount), proof);
    address to = receivers[requestId];
    (bool ok,) = to.call{value: clearAmount}("");
    require(ok, "send failed");
    delete receivers[requestId];
}
```

Right:

```solidity
function finalizeUnwrap(bytes32 requestId, uint64 clearAmount, bytes calldata proof) external {
    address to = receivers[requestId];
    require(to != address(0), "invalid request");
    delete receivers[requestId];

    bytes32[] memory handles = new bytes32[](1);
    handles[0] = requestId;
    FHE.checkSignatures(handles, abi.encode(clearAmount), proof);

    (bool ok,) = to.call{value: clearAmount}("");
    require(ok, "send failed");
}
```

### Rule: prevent replay by using one-time request records and stable request IDs; do not rely on ciphertext uniqueness unless you have a contract-specific proof that it is unique

Wrong:

```solidity
mapping(euint64 => address) private pending;
```

Right:

```solidity
uint256 private nextRequestId;
mapping(uint256 => bytes32) private pendingHandle;
mapping(uint256 => address) private pendingRecipient;
```

### Rule: if the disclosed information itself is the product, add a finality delay before granting public decryption or downstream access

Wrong:

```solidity
function discloseWinner() external {
    require(block.timestamp > auctionEnd, "too early");
    FHE.makePubliclyDecryptable(highestBidder);
    FHE.makePubliclyDecryptable(highestBid);
}
```

Right:

```solidity
uint256 private disclosureScheduledAt;

function scheduleDisclosure() external {
    require(block.timestamp > auctionEnd, "too early");
    require(disclosureScheduledAt == 0, "already scheduled");
    disclosureScheduledAt = block.timestamp;
}

function discloseWinner() external {
    require(disclosureScheduledAt != 0, "not scheduled");
    require(block.timestamp > disclosureScheduledAt + FINALITY_DELAY_SECONDS, "finality delay");
    FHE.makePubliclyDecryptable(highestBidder);
    FHE.makePubliclyDecryptable(highestBid);
}
```

## User decryption pattern

For private reads:

- contract returns an encrypted handle in a view function
- contract must have persistent access to the handle
- user must have persistent access to the handle
- frontend performs EIP-712-authorized decryption off-chain

### Rule: do not reveal private values on-chain when user decryption is enough

Wrong:

```solidity
function revealMyBalance() external {
    FHE.makePubliclyDecryptable(balances[msg.sender]);
}
```

Right:

```solidity
function confidentialBalanceOf(address account) external view returns (euint64) {
    return balances[account];
}
```

## Frontend integration

### Official docs/template flow: `@zama-fhe/relayer-sdk`

Use this when the repo or prompt matches current protocol docs or the Hardhat template.

```ts
import { initSDK, createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk";

await initSDK();

const instance = await createInstance({
  ...SepoliaConfig,
  network: window.ethereum,
});

const input = instance.createEncryptedInput(contractAddress, userAddress);
input.add64(BigInt(amount));
const encrypted = await input.encrypt();

await contract.confidentialTransfer(
  recipient,
  encrypted.handles[0],
  encrypted.inputProof,
);

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

const clearBalance = decrypted[balanceHandle];
```

Public decryption with the same SDK family:

```ts
const result = await instance.publicDecrypt([encryptedHandle]);
const clearValue = result.clearValues[encryptedHandle];
await contract.finalize(
  clearValue,
  result.decryptionProof,
);
```

### Newer SDK family: `@fhevm/sdk`

Use this when the repo already uses it.

```ts
import { setFhevmRuntimeConfig, createFhevmClient } from "@fhevm/sdk/ethers";
import { sepolia } from "@fhevm/sdk/chains";

setFhevmRuntimeConfig({ numberOfThreads: 4 });
const client = createFhevmClient({ chain: sepolia, provider });

const encrypted = await client.encrypt({
  contractAddress,
  userAddress,
  values: [{ type: "uint64", value: 42n }],
});

await contract.confidentialTransfer(
  recipient,
  encrypted.externalEncryptedValues[0],
  encrypted.inputProof,
);

const e2eTransportKeypair = await client.generateE2eTransportKeypair();
const signedPermit = await client.signDecryptionPermit({
  contractAddresses: [contractAddress],
  startTimestamp: Math.floor(Date.now() / 1000),
  durationDays: 7,
  signerAddress: await signer.getAddress(),
  signer,
  e2eTransportKeypair,
});

const [clearBalance] = await client.decrypt({
  encryptedValues: [{ encryptedValue: balanceHandle, contractAddress }],
  e2eTransportKeypair,
  signedPermit,
});
```

### Frontend rules

- Encrypt with the target contract address and the direct caller’s address.
- Reuse the same shared proof for all handles produced in a batch.
- Do not assume decryption is free-form: current docs and SDKs enforce aggregate bit-size limits (2048 bits per request).
- If the repo already uses Hardhat `hre.fhevm`, mirror that API in tests instead of importing browser SDKs into test code.

## Testing patterns

Use the Hardhat template patterns unless the repo already has stronger conventions.

### Hardhat runtime modes

- `hardhat` in-memory: mock encryption, fastest, best for CI
- `localhost` Hardhat node: mock encryption, persistent, best for frontend/dev flows
- `sepolia`: real encryption, slower, use for final validation

### Standard test pattern

```ts
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

const encrypted = await fhevm
  .createEncryptedInput(contractAddress, alice.address)
  .add64(100)
  .encrypt();

await contract.connect(alice).deposit(encrypted.handles[0], encrypted.inputProof);

const handle = await contract.confidentialBalanceOf(alice.address);
const clear = await fhevm.userDecryptEuint(FhevmType.euint64, handle, contractAddress, alice);
```

### Rule: guard tests that require the mock runtime

Wrong:

```ts
beforeEach(async function () {
  ({ contract } = await deployFixture());
});
```

Right:

```ts
beforeEach(async function () {
  if (!fhevm.isMock) this.skip();
  ({ contract } = await deployFixture());
});
```

### Rule: do not assert encrypted state only by raw handle equality across updates

Wrong:

```ts
expect(await contract.getCount()).to.equal(previousHandle);
```

Right:

```ts
const handle = await contract.getCount();
const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, alice);
expect(clear).to.equal(1);
```

### Rule: when you want to assert without decrypting, assert on initialization, authorization, emitted handles, and downstream behavior

Wrong:

```ts
expect(await contract.confidentialBalanceOf(alice.address)).to.not.equal(ethers.ZeroHash); // too weak by itself
```

Right:

```ts
const transferred = await contract.callStatic.confidentialTransferFrom(
  alice.address,
  escrow.address,
  encryptedAmountHandle,
  inputProof,
);
await expect(escrow.finalizeUsingTransferred(transferred)).to.not.be.reverted;
```

## Deployment patterns

Treat deployment as part of the generated deliverable, not an afterthought.

For a fresh project based on the official template:

```bash
npm install
npx hardhat vars set MNEMONIC
npx hardhat vars set INFURA_API_KEY
npx hardhat vars set ETHERSCAN_API_KEY
npm run compile
npm run test
```

### Chain selection rules

- Use `hardhat` for fast unit tests and CI.
- Use `localhost` for persistent local flows and frontend/manual testing.
- Use `sepolia` for final real-encryption validation and public reviewer demos.
- Unless the repo explicitly targets another host chain in the future, default real deployments to Ethereum Sepolia because that is the currently documented Zama Protocol testnet host chain.

### Wallet rules for deployment

- Local deployment uses default Hardhat accounts unless the task specifically needs signer separation.
- Sepolia deployment should use a dedicated deployer wallet with only testnet funds.
- Store the mnemonic in Hardhat vars or another local secret store the repo already uses.
- Never write a mnemonic or private key into tracked files.
- If no funded deployer exists, output the wallet address and ask the human for Sepolia ETH funding.
- Do not invent a `$ZAMA` funding requirement for normal confidential-contract deployment. `$ZAMA` is only relevant for specific protocol-app, staking, governance, or token workflows.

### Local deployment flow

```bash
npx hardhat node
npx hardhat deploy --network localhost
```

After local deployment, the agent should also surface one interaction path:

- a Hardhat task
- a test fixture
- or a frontend snippet

so the user can verify the deployed contract is reachable.

### Sepolia deployment flow

```bash
npx hardhat deploy --network sepolia
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
npx hardhat test --network sepolia
```

### Deployment rules

- Do not claim Sepolia validation unless the network deployment was actually run.
- Prefer localhost or in-memory Hardhat for the first compile-and-test feedback loop.
- Prefer `hardhat-deploy`-style deploy scripts when the repo already uses the official template shape.
- If a contract depends on public decryption callbacks, explain in the deploy notes which event or handle the off-chain relayer will use.
- If a frontend is part of the deliverable, include the contract address binding point the frontend must use during encryption.

## OpenZeppelin confidential contracts and ERC-7984

When the user asks for a confidential token, default to OZ’s audited patterns.

### Base token skeleton

```solidity
import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";

contract MyConfidentialToken is ZamaEthereumConfig, ERC7984, Ownable2Step {
    constructor(address owner_)
        ERC7984("My Token", "MTK", "ipfs://contract-uri")
        Ownable(owner_)
    {}

    function confidentialMint(
        address to,
        externalEuint64 encryptedAmount,
        bytes calldata inputProof
    ) external onlyOwner returns (euint64 transferred) {
        return _mint(to, FHE.fromExternal(encryptedAmount, inputProof));
    }
}
```

### ERC-7984 rules

- ERC-7984 balances and transfer amounts are `euint64`.
- `confidentialTransfer...` returns the actual transferred `euint64`. Use that return value.
- Operators are time-bounded infinite approvals, not ERC-20 allowances.
- `requestDiscloseEncryptedAmount` / `discloseEncryptedAmount` are public-decryption helpers, not private user reads.
- Wrapper contracts cap confidential decimals at 6 and use a conversion `rate()`.
- `wrap(...)` is synchronous; `unwrap(...)` is async and finalized later with decryption proof.

### Rule: for ERC-7984 to ERC-20 or unwrap flows, follow the two-step async pattern

Wrong:

```solidity
function unwrapNow(euint64 amount) external {
    _burn(msg.sender, amount);
    SafeERC20.safeTransfer(underlying, msg.sender, 1_000_000); // guessed clear amount
}
```

Right:

```solidity
function unwrap(
    address from,
    address to,
    externalEuint64 encryptedAmount,
    bytes calldata inputProof
) external returns (bytes32 requestId) {
    euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
    euint64 burned = _burn(from, amount);
    FHE.makePubliclyDecryptable(burned);
    requestId = FHE.toBytes32(burned);
    pendingRecipient[requestId] = to;
}
```

## Anti-patterns to actively prevent

### 1. Using `FHE.allow()` where `FHE.allowTransient()` is correct

Wrong:

```solidity
FHE.allow(amount, address(token));
token.confidentialTransferFrom(msg.sender, address(this), amount);
```

Right:

```solidity
FHE.allowTransient(amount, address(token));
token.confidentialTransferFrom(msg.sender, address(this), amount);
```

### 2. Missing `FHE.isSenderAllowed()` on an external function that receives a ciphertext handle

Wrong:

```solidity
function useAmount(euint64 amount) external {
    pendingAmount = amount;
}
```

Right:

```solidity
function useAmount(euint64 amount) external {
    require(FHE.isSenderAllowed(amount), "sender not allowed");
    pendingAmount = amount;
    FHE.allowThis(amount);
}
```

### 3. Comparing requested amount instead of transferred amount in auction or escrow logic

Wrong:

```solidity
euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
token.confidentialTransferFrom(msg.sender, address(this), amount);
highestBid = FHE.select(FHE.gt(amount, highestBid), amount, highestBid);
```

Right:

```solidity
euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
FHE.allowTransient(amount, address(token));
euint64 transferred = token.confidentialTransferFrom(msg.sender, address(this), amount);
ebool isBestBid = FHE.and(
    FHE.gt(transferred, FHE.asEuint64(0)),
    FHE.gt(transferred, highestBid)
);
highestBid = FHE.select(isBestBid, transferred, highestBid);
FHE.allowThis(highestBid);
```

### 4. Forgetting to delete async mapping entries before external calls

Wrong:

```solidity
address to = pending[requestId];
externalTarget.call(data);
delete pending[requestId];
```

Right:

```solidity
address to = pending[requestId];
delete pending[requestId];
externalTarget.call(data);
```

### 5. Arithmetic overflow without an encrypted `FHE.select` guard

Wrong:

```solidity
totalSupply = FHE.add(totalSupply, mintedAmount);
```

Right:

```solidity
euint64 tentative = FHE.add(totalSupply, mintedAmount);
ebool overflow = FHE.lt(tentative, totalSupply);
totalSupply = FHE.select(overflow, totalSupply, tentative);
FHE.allowThis(totalSupply);
```

### 6. Making information publicly decryptable without a finality delay

Wrong:

```solidity
function reveal() external {
    FHE.makePubliclyDecryptable(secretResult);
}
```

Right:

```solidity
function scheduleReveal() external {
    scheduledAt = block.timestamp;
}

function reveal() external {
    require(block.timestamp > scheduledAt + FINALITY_DELAY_SECONDS, "finality delay");
    FHE.makePubliclyDecryptable(secretResult);
}
```

### 7. Using arbitrary external calls from privileged contexts

Wrong:

```solidity
function execute(address target, bytes calldata data) external onlyOwner {
    (bool ok,) = target.call(data);
    require(ok, "call failed");
}
```

Right:

```solidity
function executeApprovedModule(address module, bytes calldata data) external onlyOwner {
    require(approvedModules[module], "module not approved");
    (bool ok,) = module.call(data);
    require(ok, "call failed");
}
```

### 8. Encrypting inputs for third-party callers instead of direct callers

Wrong:

```solidity
function forward(IERC7984 token, address to, externalEuint64 amount, bytes calldata proof) external {
    token.confidentialTransferFrom(address(this), to, amount, proof);
}
```

Right:

```solidity
function forward(IERC7984 token, address from, address to, externalEuint64 encryptedAmount, bytes calldata proof) external {
    euint64 amount = FHE.fromExternal(encryptedAmount, proof);
    FHE.allowTransient(amount, address(token));
    token.confidentialTransferFrom(from, to, amount);
}
```

### 9. Transient storage collision under Account Abstraction

Wrong:

```solidity
function submit(euint64 handleFromAnotherCall) external {
    require(FHE.isSenderAllowed(handleFromAnotherCall), "reused transient handle");
    process(handleFromAnotherCall);
}
```

Right:

```solidity
function submit(externalEuint64 encryptedAmount, bytes calldata inputProof) external {
    euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
    process(amount);
}
```

Account-abstraction note:

- If you are building the wallet or bundler layer, detect `confidentialProtocolId()` and wipe transient storage between FHE-sensitive user operations. There is a library cleanup function (`FHE.cleanTransientStorage()`), but wallet-level cleanup is the more reliable design.

### 10. Missing `FHE.allowThis()` after storing or updating encrypted state

Wrong:

```solidity
winner = FHE.select(isNewWinner, FHE.asEaddress(msg.sender), winner);
```

Right:

```solidity
eaddress nextWinner = FHE.select(isNewWinner, FHE.asEaddress(msg.sender), winner);
winner = nextWinner;
FHE.allowThis(nextWinner);
```

### 11. Using public view functions to expose plaintext instead of handles

Wrong:

```solidity
function balanceOf(address user) external view returns (uint64) {
    return 0; // invented plaintext path
}
```

Right:

```solidity
function confidentialBalanceOf(address user) external view returns (euint64) {
    return balances[user];
}
```

### 12. Using encrypted divisors with `div` or `rem`

Wrong:

```solidity
euint64 fee = FHE.div(amount, encryptedDivisor);
```

Right:

```solidity
euint64 fee = FHE.div(amount, 100);
```

## Security checklist

Before calling a contract complete, verify all of the following:

- The contract inherits the correct config (`ZamaEthereumConfig` or repo-equivalent) and compiles with the intended FHEVM stack.
- Every stored or reused ciphertext handle gets `FHE.allowThis(...)`.
- Every user-readable stored handle also gets `FHE.allow(handle, user)` or equivalent persistent user access.
- Every external/public function that accepts a direct handle checks `FHE.isSenderAllowed(...)` or `FHE.isAllowed(handle, msg.sender)` before using it.
- Every fresh encrypted user input uses `externalE*` plus `FHE.fromExternal(...)`.
- Helper-contract calls use `FHE.allowTransient(...)` unless cross-transaction persistence is explicitly required and justified.
- No business logic depends on requested encrypted amounts when the underlying transfer can silently clamp to zero or a smaller value.
- Critical arithmetic has encrypted overflow/underflow guards with safe fallback selection.
- No code branches on encrypted values with `if`, `require`, or `revert`.
- Public decryption callbacks verify proofs with `FHE.checkSignatures(...)`.
- Async request records are one-time use and are deleted before any external call or value transfer.
- Decryption proof handle order matches ABI cleartext order exactly.
- Publicly decryptable handles are final outputs only, not intermediate secrets.
- If the disclosed information is itself valuable, there is a finality delay before disclosure or downstream access.
- No privileged arbitrary external call can be abused to touch ACL contracts or leak handles.
- Delegatecall exposure has been considered; a delegatecalled callee can access caller-held handles.
- Account-abstraction integrations wipe transient storage between FHE-sensitive user operations.
- Third-party caller encryption contexts are either avoided or explicitly re-bound safely by the intermediate contract.
- `euint256` is used only when its limited operation set is acceptable.
- Tests exist in mock mode and, for production paths, on Sepolia with real encryption.
- Frontend encryption uses the intended contract address and direct caller address.

If any item fails, fix the design before adding more features.

## Task recipes for common prompts

### Prompt: "Write me a confidential voting contract using FHEVM"

Do all of the following unless the repo already imposes stronger requirements:

1. Use the official Hardhat stack and `FHE` imports.
2. Model the vote as `ebool` for yes/no or `euint8` for bounded multi-choice voting.
3. Ingest votes with `externalE*` plus `FHE.fromExternal(...)`.
4. Store per-user encrypted vote handles only if the user needs private readback later, and then grant both `FHE.allowThis(...)` and `FHE.allow(..., voter)`.
5. Update encrypted tallies with `FHE.select(...)`, not secret-dependent `require`.
6. Add a public result flow with a finality delay, `FHE.makePubliclyDecryptable(...)`, and `FHE.checkSignatures(...)`.
7. Ship a Hardhat test that covers encrypted input, private decrypt of a user-readable handle, and public result finalization.
8. Ship a frontend example for encrypted voting and result publication.
9. Use `examples/01-confidential-voting` as the structural reference when no better repo-local pattern exists.

### Prompt: "How do I build a confidential ERC-7984 token?"

Do all of the following unless the repo already standardizes on a stronger pattern:

1. Use OpenZeppelin confidential contracts instead of hand-rolling ERC-7984 logic.
2. Keep balances and transfer amounts as `euint64`.
3. Implement confidential mint using `externalEuint64` plus `FHE.fromExternal(...)` when confidentiality is desired.
4. Use the actual transferred amount returned by `confidentialTransfer...` or burn/unwrap flows for downstream business logic.
5. If wrapping ERC-20, explain the async unwrap finalization path.
6. Include tests for confidential mint and confidential transfer.
7. Include a frontend example for encrypting a transfer amount and privately decrypting a balance.
8. Use `examples/02-confidential-erc7984` and `references/06-openzeppelin-erc7984.md` as the default reference set.

### Prompt: "Add FHEVM frontend integration" or "How does fhevmjs work here?"

1. Detect whether the repo already uses `@zama-fhe/relayer-sdk` or `@fhevm/sdk`.
2. Stay consistent with the repo if it already has a chosen SDK.
3. If the user says `fhevmjs` generically and no repo-local choice exists, use the current official relayer flow.
4. Bind encryption to the target contract address and direct caller address.
5. Show input encryption, contract submission, and either user decryption or public decryption depending on the task.
6. Use `references/05-frontend-testing-and-deployment.md` and the template files in `templates/`.

### Prompt: "Deploy this contract for me"

1. Check whether the repo already has a deployment wallet configured.
2. If the task is local-only, use Hardhat local accounts.
3. If the task is a real Zama deployment, target `sepolia` by default.
4. If no Sepolia deployer wallet exists, create a fresh throwaway deployer wallet locally, store its mnemonic in local secrets, and present the wallet address.
5. Check whether the wallet has Sepolia ETH before attempting deployment.
6. If the wallet is unfunded and there is no approved automated faucet flow, ask the human to fund it.
7. Run compile and tests before deployment, then deploy, then report contract address and any verification or frontend-binding steps.

### Prompt: "Review this FHEVM contract"

1. Run through the anti-pattern list in `references/07-anti-patterns-and-security-checklist.md`.
2. Check direct-handle functions for `FHE.isSenderAllowed(...)`.
3. Check stored/reused handles for `FHE.allowThis(...)`.
4. Check helper-contract calls for overbroad `FHE.allow(...)` where `FHE.allowTransient(...)` should be used.
5. Check arithmetic for silent wraparound bugs.
6. Check public-decryption flows for one-time request consumption, exact handle ordering, and finality delay.
7. If tokens are involved, check requested-vs-transferred amount logic explicitly.
