# Reviewer Runbook

This runbook is for the final real-agent proof on a machine that will run Claude Code with this repository installed as a skill.

## 1. Install Claude Code

Official installation methods:

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

or

```bash
npm install -g @anthropic-ai/claude-code
```

Then verify:

```bash
claude --version
```

## 2. Clone this repository

```bash
git clone https://github.com/Krusherk/zama-skill.git
cd zama-skill
```

## 3. Install the skill

Fastest cross-agent install:

```bash
npx skills add Krusherk/zama-skill
```

Recommended:

```bash
./scripts/install-claude-skill.sh --personal
```

Manual fallback:

```bash
mkdir -p ~/.claude/skills/zama-fhevm
cp -R ./* ~/.claude/skills/zama-fhevm/
```

Alternative live-update install:

```bash
./scripts/install-claude-skill.sh --personal --link
```

## 4. Open a clean FHEVM workspace

Recommended:

- start from `zama-ai/fhevm-hardhat-template`
- ensure `npm install` has been run

## 5. Invoke the skill

Use either natural language or explicit invocation:

```text
/zama-fhevm Write me a confidential voting contract using FHEVM
```

or

```text
Write me a confidential ERC-7984 token with OpenZeppelin on FHEVM. Include tests and frontend code.
```

## 6. Demo commands to run on camera

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

## 7. Mistake-prevention moment to show

Have the agent explain and then demonstrate at least one of these:

- why `FHE.isSenderAllowed(...)` is required on direct handle inputs
- why `FHE.allowTransient(...)` is correct for same-tx helper calls
- why actual transferred amount must be used instead of requested amount
- why async request state must be deleted before external calls

## 8. Evidence to capture

- the natural-language prompt
- the skill loading or explicit invocation
- generated contract/test/frontend files
- successful compile
- successful tests
- successful localhost deployment
- a short verbal explanation of one prevented anti-pattern
