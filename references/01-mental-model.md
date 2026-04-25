# Mental Model

Use this file when the task needs protocol architecture, execution semantics, or reasoning about why FHEVM code is shaped differently from normal Solidity.

## What an FHEVM contract really stores

- Encrypted Solidity values are not plaintext numbers or booleans.
- They are ciphertext handles represented onchain as `bytes32`-like references.
- The EVM stores and moves handles; the encrypted computation happens offchain.

## Main protocol components

- FHEVM Solidity library: the developer-facing API for encrypted types and operations.
- Host contracts: EVM contracts on the application chain.
- Coprocessors: decentralized offchain services that execute the encrypted computation requested by host contracts.
- Gateway: the orchestrator that validates inputs, coordinates computation, bridges ciphertexts, and manages protocol services.
- KMS: threshold key-management service that authorizes decryption and proof generation.
- Relayer/oracle: offchain services and SDK layers that help clients submit encrypted inputs and request decryptions.

## Onchain vs offchain execution

The critical idea for an agent:

1. A user encrypts inputs offchain for a specific contract and caller context.
2. The contract receives external encrypted values plus an input proof.
3. The contract uses `FHE.fromExternal(...)` or other `FHE.*` operations to build encrypted state transitions.
4. Coprocessors execute the FHE computation offchain.
5. The chain stores resulting ciphertext handles and ACL permissions.

This is why handles must be treated as protected capabilities, not just data.

## Why secret predicates cannot revert

Normal Solidity logic often says:

- compare
- `require`
- revert if the condition fails

That does not work when the condition depends on encrypted values, because the revert itself leaks information about the secret branch.

FHEVM code therefore uses:

- `FHE.select(...)`
- silent clamping
- encrypted success flags
- actual transferred amount returns

instead of ordinary secret-dependent reverts.

Public facts can still revert:

- invalid proofs
- invalid public role checks
- invalid public addresses
- expired public windows
- malformed async callbacks

## ACL as part of correctness

The ACL contract decides who can:

- reuse a handle later
- decrypt a handle privately
- consume a handle inside another contract
- expose a handle to public decryption

This is not optional glue code. In FHEVM, ACL mistakes are semantic bugs.

## Three permission lifetimes

- `FHE.allowThis(handle)`: persistent access for the current contract across future transactions.
- `FHE.allow(handle, account)`: persistent access for another user or contract across future transactions.
- `FHE.allowTransient(handle, account)`: one-transaction access for same-tx helper flows.

## The agent’s mental checklist

When generating FHEVM code, pause and check:

- Is this input a fresh encrypted input, or a reused ciphertext handle?
- Who must read or reuse this handle later?
- Is the next consumer in the same transaction or a future one?
- Could a requested amount differ from the actual transferred amount?
- Does this branch depend on secret state?
- Is public decryption really necessary, or is user decryption enough?

## Common mental-model failures

- Treating `euint64` like a normal `uint64`
- Assuming overflow/underflow reverts
- Forgetting that access control follows the handle, not just the variable name
- Assuming a returned ciphertext is safe to reuse later without new permissions
- Making public decryption the default read path instead of the exceptional path
