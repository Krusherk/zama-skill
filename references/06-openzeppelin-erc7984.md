# OpenZeppelin Confidential Contracts And ERC-7984

Use this file when the task involves confidential fungible tokens, operators, wrappers, or ERC-20 bridging.

## What ERC-7984 changes

ERC-7984 is the confidential-token analogue of ERC-20:

- balances are `euint64`
- transfer amounts are `euint64`
- transfers and updates operate on encrypted values
- operators replace the familiar allowance-style UX in many flows

## Default implementation guidance

When the user asks for a confidential token, prefer OpenZeppelin confidential contracts over a custom token implementation.

Common base:

```solidity
import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";

contract MyConfidentialToken is ZamaEthereumConfig, ERC7984, Ownable2Step {
    constructor(address owner_)
        ERC7984("My Token", "MTK", "ipfs://contract-uri")
        Ownable(owner_)
    {}
}
```

## Agent rules for ERC-7984

- balances and transfer amounts are `euint64`
- use the return value of `confidentialTransfer...`
- operators are time-bounded permissions, not normal ERC-20 allowances
- user decryption is for private reads
- `requestDiscloseEncryptedAmount` and `discloseEncryptedAmount` are public-decryption helpers

## Actual transferred amount rule

This is one of the most important token-specific rules:

- do not compare the requested encrypted amount
- compare the actual transferred or burned encrypted amount returned by the token

This matters in:

- auctions
- escrow
- vault accounting
- wrappers
- swap settlement

## Wrappers

`ERC7984ERC20Wrapper` handles wrap/unwrap between standard ERC-20 and confidential ERC-7984 representations.

Important wrapper facts:

- confidential decimals cap at 6
- wrappers use a conversion `rate()`
- `wrap(...)` is synchronous
- `unwrap(...)` is asynchronous and must later be finalized with a decryption proof

## Async unwrap pattern

1. user requests unwrap with encrypted amount
2. wrapper burns confidential amount
3. wrapper marks the burned amount publicly decryptable
4. offchain relayer obtains clear amount and proof
5. wrapper finalizes unwrap and releases ERC-20

## Caution on request ids

Some OZ flows derive request ids from ciphertext handles in a context where the uniqueness assumptions are controlled. Do not generalize that into unrelated designs. For most new application code, use explicit one-time request ids.

## What an agent should emit for ERC-7984 prompts

Minimum output quality:

- use the OZ contracts
- mint with `externalEuint64` plus `inputProof` when confidentiality is required
- test confidential mint and transfer
- explain operator usage if `transferFrom`-style flows appear
- use async finalize flows for unwrap or public disclosure
- mention the actual-transferred-amount rule explicitly
