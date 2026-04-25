# Reviewer Runbook

This runbook is for the final real-agent proof on a machine that has Claude Code installed.

## 1. Install the skill

```bash
mkdir -p ~/.claude/skills/zama-fhevm
cp -R /home/crack/Documents/zama/* ~/.claude/skills/zama-fhevm/
```

## 2. Open a clean FHEVM workspace

Recommended:

- start from `zama-ai/fhevm-hardhat-template`
- ensure `npm install` has been run

## 3. Invoke the skill

Use either natural language or explicit invocation:

```text
/zama-fhevm Write me a confidential voting contract using FHEVM
```

or

```text
Write me a confidential ERC-7984 token with OpenZeppelin on FHEVM. Include tests and frontend code.
```

## 4. Demo commands to run on camera

For the generated project:

```bash
npm install
npm run compile
npm run test
npx hardhat node
npx hardhat deploy --network localhost
```

If Sepolia credentials are set:

```bash
npx hardhat deploy --network sepolia
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

## 5. Mistake-prevention moment to show

Have the agent explain and then demonstrate at least one of these:

- why `FHE.isSenderAllowed(...)` is required on direct handle inputs
- why `FHE.allowTransient(...)` is correct for same-tx helper calls
- why actual transferred amount must be used instead of requested amount
- why async request state must be deleted before external calls

## 6. Evidence to capture

- the natural-language prompt
- the skill loading or explicit invocation
- generated contract/test/frontend files
- successful compile
- successful tests
- successful localhost deployment
- a short verbal explanation of one prevented anti-pattern
