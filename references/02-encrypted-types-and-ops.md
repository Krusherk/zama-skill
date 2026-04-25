# Encrypted Types And Operations

Use this file when the task needs detailed type selection, supported operation coverage, or HCU/gas tradeoffs.

## Type selection table

| Type | Bits | Best use | Key limits | Cost notes |
| --- | --- | --- | --- | --- |
| `ebool` | 2 | confidential yes/no, flags, comparison outputs | cannot drive normal `if`/`require` | cheapest logical tier |
| `euint8` | 8 | enums, small counters, bounded scores | wraps on overflow | cheapest integer arithmetic |
| `euint16` | 16 | small IDs and bounded supplies | wraps on overflow | slightly more expensive than `euint8` |
| `euint32` | 32 | counters, bounded timestamps, modest accounting | wraps on overflow | practical middle ground |
| `euint64` | 64 | balances, bids, token amounts | wraps on overflow | preferred confidential-finance default |
| `euint128` | 128 | large but still arithmetic-friendly ranges | wraps on overflow | noticeably more expensive |
| `eaddress` | 160 | encrypted addresses only | only `eq`, `ne`, `select` | more expensive than smaller numeric types |
| `euint256` | 256 | bitwise/comparison-heavy 256-bit use cases | no normal arithmetic family | expensive; avoid unless necessary |

## Current operation support summary

- `ebool`: `and`, `or`, `xor`, `eq`, `ne`, `not`, `select`, `rand`
- `euint8/euint16/euint32/euint64/euint128`: `add`, `sub`, `mul`, `div` with plaintext rhs, `rem` with plaintext rhs, `neg`, `min`, `max`, `and`, `or`, `xor`, `not`, `shl`, `shr`, `rotl`, `rotr`, `eq`, `ne`, `ge`, `gt`, `le`, `lt`, `select`, `rand`
- `eaddress`: `eq`, `ne`, `select`
- `euint256`: `and`, `or`, `xor`, `not`, `neg`, `shl`, `shr`, `rotl`, `rotr`, `eq`, `ne`, `select`, `rand`

## Selection heuristics

- Prefer the smallest type that safely fits the business domain.
- Default to `euint64` for confidential tokens, bids, escrow balances, and payment rails.
- Use `euint32` for counters or quotas that will never approach `uint64`.
- Use `ebool` instead of `euint8` when the domain is genuinely binary.
- Use `eaddress` only for address identity and encrypted winner/owner selection.
- Use `euint256` only if the lack of arithmetic is acceptable.

## HCU and gas tradeoffs

The precise numbers may evolve, but the current pattern is stable:

- scalar operations are cheaper than ciphertext-vs-ciphertext operations
- larger encrypted widths cost more
- `euint128` and `euint256` should be treated as premium types
- `select` is meaningful work, not a free ternary

Approximate trends from the current docs:

- scalar `add`: `euint8` about 84k HCU, `euint64` about 133k, `euint128` about 172k
- scalar `mul`: `euint8` about 122k HCU, `euint64` about 365k, `euint128` about 696k
- `select`: ~55k for smaller integer/bool types, higher for `eaddress` and `euint256`
- current devnet transaction budgeting is roughly `20,000,000` global HCU and `5,000,000` depth

## Operation reference

### Input conversion and casts

```solidity
FHE.asEbool(true);
FHE.asEuint8(1);
FHE.asEuint16(2);
FHE.asEuint32(3);
FHE.asEuint64(4);
FHE.asEuint128(5);
FHE.asEuint256(6);
FHE.asEaddress(msg.sender);

FHE.fromExternal(externalBool, inputProof);
FHE.fromExternal(externalUint64, inputProof);
FHE.fromExternal(externalAddress, inputProof);
```

### Arithmetic

```solidity
FHE.add(a, b);
FHE.add(a, 1);
FHE.sub(a, b);
FHE.sub(a, 1);
FHE.mul(a, b);
FHE.mul(a, 10);
FHE.div(a, 10);
FHE.rem(a, 10);
FHE.neg(a);
FHE.min(a, b);
FHE.max(a, b);
```

### Bitwise and shifts

```solidity
FHE.and(a, b);
FHE.or(a, b);
FHE.xor(a, b);
FHE.not(a);
FHE.shl(a, uint8(3));
FHE.shr(a, uint8(3));
FHE.rotl(a, uint8(3));
FHE.rotr(a, uint8(3));
```

### Comparisons and conditional selection

```solidity
FHE.eq(a, b);
FHE.ne(a, b);
FHE.ge(a, b);
FHE.gt(a, b);
FHE.le(a, b);
FHE.lt(a, b);
FHE.select(cond, whenTrue, whenFalse);
```

### Random generation

```solidity
FHE.randEbool();
FHE.randEuint8();
FHE.randEuint64();
FHE.randEuint64(100);
```

## Type-specific warnings

### `eaddress`

- It is not a general-purpose integer.
- Do not cast addresses down into `euint64`.
- Use it for encrypted address identity, winner selection, or private recipient logic.

### `euint256`

- Do not assume it can replace `uint256` business logic.
- It lacks `add`, `sub`, `mul`, `div`, `rem`, `min`, `max`, `gt`, `ge`, `lt`, `le`.
- Use it for bitwise, equality, or protocol-specific 256-bit operations only.

## Practical rules for agents

- Prefer scalar overloads where available.
- Never use encrypted divisors with `div` or `rem`.
- Treat arithmetic overflow as a business-logic problem, not a compiler/runtime guarantee.
- If a value is later publicly decrypted, choose the smallest reasonable type so the agent does not overspend HCU.
