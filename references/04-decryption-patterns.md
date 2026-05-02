# Decryption Patterns

Use this file when the task requires private user decryption, public decryption, async callback safety, or replay prevention.

## Two distinct decryption flows

### User decryption

Use when the value should remain private to a user.

Pattern:

1. contract returns an encrypted handle in a view function
2. the contract has persistent access to the handle
3. the user has persistent access to the handle
4. frontend obtains an EIP-712 signed permit
5. SDK decrypts privately offchain

Do not mark private values publicly decryptable just to show a user their own data.

### Public decryption

Use only when the value should become public.

Pattern:

1. contract marks final ciphertexts with `FHE.makePubliclyDecryptable(...)`
2. offchain client or relayer calls `publicDecrypt`
3. the clear values and KMS proof are submitted back onchain
4. contract verifies with `FHE.checkSignatures(...)`

## User decryption reference flow

Onchain:

```solidity
function confidentialBalanceOf(address account) external view returns (euint64) {
    return balances[account];
}
```

Offchain:

1. generate transport keypair
2. build EIP-712 typed data
3. sign with the user wallet
4. call SDK decrypt with:
   - encrypted handle
   - contract address
   - permit
   - transport keypair

## Public decryption reference flow

Onchain:

```solidity
FHE.makePubliclyDecryptable(resultHandle);
```

Offchain:

```ts
const decrypted = await instance.publicDecrypt([handleA, handleB]);
```

Onchain finalization:

```solidity
bytes32[] memory handles = new bytes32[](2);
handles[0] = handleA;
handles[1] = handleB;
FHE.checkSignatures(handles, abiEncodedClearValues, decryptionProof);
```

## Handle order and ABI order must match exactly

The proof is tied to:

- the ordered handle list
- the ordered ABI-encoded clear values

If the order changes, verification should fail.

## Delete async state before external calls

This is mandatory in finalize callbacks.

Correct sequence:

1. load request state
2. validate request exists
3. verify proof
4. delete request state
5. perform external call or value transfer

The delete-before-call rule prevents:

- replay of the same request
- inconsistent reentrancy behavior
- stale callback state from surviving partial execution paths

Important retry rule:

- if `FHE.checkSignatures(...)` reverts, the request state should still exist so the callback can be retried with a correct proof
- do not delete request state before proof verification succeeds

## Replay prevention

Preferred approach:

- use a monotonic request id or other stable unique id
- map request id to handle and recipient
- consume the request exactly once

Do not assume ciphertext uniqueness unless the contract-specific construction proves it. Some OZ wrapper flows safely use ciphertext-derived ids in a very specific context, but that assumption should not be generalized.

## Finality-delay rule

If the decrypted output itself has economic value:

- sealed-bid results
- auction winners before settlement
- price disclosures
- confidential strategy outputs

add a finality delay before public disclosure or downstream settlement.

This reduces risks from reorgs, settlement races, and “value from early reveal” bugs.

## Agent rules

- Default to user decryption for private reads.
- Use public decryption only for public outputs.
- Verify the exact handle order and ABI order.
- Delete pending request state before external calls.
- Use one-time request records.
- Add finality delay when the disclosed result is economically sensitive.
