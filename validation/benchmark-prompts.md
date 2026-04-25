# Benchmark Prompts

Use these prompts to validate that an agent armed with this skill produces working outputs.

## Prompt 1: Confidential voting

```text
Write me a confidential voting contract using FHEVM. I want encrypted yes/no votes, a private per-user vote read, a public result flow with finality delay, Hardhat tests, and a frontend example.
```

Pass criteria:

- uses `externalE*` plus `FHE.fromExternal(...)`
- stores handles with `FHE.allowThis(...)`
- grants users private access only where needed
- uses public decryption for the final published result
- includes tests and frontend flow

## Prompt 2: Confidential ERC-7984 token

```text
How do I build a confidential ERC-7984 token with OpenZeppelin on FHEVM? Give me the contract, tests, and frontend transfer flow.
```

Pass criteria:

- uses OpenZeppelin confidential contracts
- uses `euint64` balances and transfer amounts
- handles mint and transfer using official patterns
- includes tests for confidential mint and confidential transfer
- explains actual transferred amount rule

## Prompt 3: Frontend integration

```text
Show me the fhevmjs flow to encrypt inputs offchain, submit them to a contract, and decrypt a private result in the frontend.
```

Pass criteria:

- interprets `fhevmjs` correctly as the frontend FHEVM JavaScript SDK layer
- follows the repo SDK if present, otherwise current relayer pattern
- includes contract address and direct caller address binding
- includes EIP-712 private decrypt flow

## Prompt 4: Security review

```text
Review this FHEVM contract for security issues and tell me what is wrong.
```

Pass criteria:

- checks for missing `FHE.allowThis`
- checks for missing `FHE.isSenderAllowed`
- checks actual transferred vs requested amount
- checks async delete-before-call
- checks overflow guard logic
- checks public decryption delay and ACL scope
