# ACL And Input Proofs

Use this file when the task involves permission lifetimes, input ingestion, direct ciphertext handles, or account-abstraction safety.

## ACL rules

The contract is correct only if the right parties can access the right handles for the right duration.

- `FHE.allowThis(handle)`: the current contract needs the handle again in a future transaction.
- `FHE.allow(handle, account)`: a user or another contract needs persistent access across future transactions.
- `FHE.allowTransient(handle, account)`: a helper contract needs access only in the current transaction.
- `FHE.isSenderAllowed(handle)`: the direct caller must prove authorization when passing a handle directly.
- `FHE.isAllowed(handle, account)`: explicit form when the account is not simply `msg.sender`.

## Minimum-permission principle

Grant only the permissions required by the intended flow:

- stored state: always `FHE.allowThis`
- user-private reads later: `FHE.allowThis` and `FHE.allow(..., user)`
- same-tx helper contract: `FHE.allowTransient`
- cross-tx helper or module: `FHE.allow`, but only when justified

## Fresh encrypted inputs vs existing ciphertext handles

This distinction is mandatory.

### Fresh encrypted inputs

Use:

```solidity
function deposit(externalEuint64 encryptedAmount, bytes calldata inputProof) external {
    euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
    ...
}
```

Properties:

- created offchain for a specific contract address and direct caller address
- validated by `FHE.fromExternal(...)`
- do not call `FHE.isSenderAllowed(...)` on the `externalE*` wrapper itself

### Existing ciphertext handles

Use:

```solidity
function useAmount(euint64 amount) external {
    require(FHE.isSenderAllowed(amount), "sender not allowed");
    ...
}
```

Properties:

- the argument is a handle that already exists
- the caller must be authorized to use that handle
- omitting the sender check is a real security bug

## Why `FHE.isSenderAllowed()` is mandatory

Any external/public function that accepts `euintX`, `ebool`, or `eaddress` directly is receiving a reusable ciphertext handle.

Without a sender-authorization check:

- one user could pass another user’s handle
- a stale handle from a prior flow could be replayed
- helper contracts could accept handles they were never intended to use

The safe default is:

```solidity
require(FHE.isSenderAllowed(handle), "sender not allowed");
```

## Input proofs

Input proofs exist because the contract needs cryptographic assurance that:

- the encrypted values were produced for this target contract
- the encrypted values were produced for this direct caller
- the ciphertext bundle is authentic and unmodified

This is why the offchain encrypt call binds:

- contract address
- caller address
- packed values

## Multi-value proof batching

Multiple encrypted values can share a single proof:

```ts
const input = fhevm.createEncryptedInput(contractAddress, userAddress);
input.addBool(true);
input.add64(100n);
input.add8(2n);
const encrypted = await input.encrypt();
```

Then map the handle indexes correctly onchain:

```solidity
ebool enabled = FHE.fromExternal(enabledHandle, inputProof);
euint64 amount = FHE.fromExternal(amountHandle, inputProof);
euint8 mode = FHE.fromExternal(modeHandle, inputProof);
```

## Third-party caller binding

Do not encrypt a value for an end user and then blindly pass it through an intermediate contract as if the intermediate contract were the intended caller.

Safe pattern:

1. intermediate contract ingests the fresh input with `FHE.fromExternal(...)`
2. intermediate contract re-binds or forwards only the internal handle
3. intermediate contract grants only the minimum downstream permissions

## Account abstraction caveat

Transient permissions can collide under account abstraction if a wallet or bundler reuses transaction context carelessly across FHE-sensitive operations.

Agent rule:

- never rely on old transient permissions across user operations
- prefer fresh encrypted inputs for user-initiated actions
- if building wallet/bundler infrastructure, detect `confidentialProtocolId()` and wipe transient storage between FHE-sensitive operations

## Wrong vs right reminders

Wrong:

- calling `FHE.allow(...)` for a same-tx helper call
- skipping sender checks on direct handles
- inventing old overloads instead of `FHE.fromExternal(...)`
- encrypting for a third-party caller path without rebinding

Right:

- `FHE.allowTransient(...)` for same-tx helper calls
- `FHE.isSenderAllowed(...)` on direct handles
- `externalE*` plus `inputProof` plus `FHE.fromExternal(...)`
- rebinding through the intermediate contract before downstream use
