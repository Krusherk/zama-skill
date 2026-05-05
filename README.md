# Zama FHEVM All-In-One Skill - Read till end.

This repository is a submission for Zama's bounty to create production-ready AI coding skills for confidential smart contract development.

## Quick install

The simplest cross-agent install path is the open `skills` CLI:

```bash
npx skills add Krusherk/zama-skill
```

That command installs this repository as an agent skill package and places the skill in the right location for supported tools such as Claude Code, Codex, Cursor, Windsurf, and others detected on the machine.

Useful variants:

```bash
# install globally instead of project-local
npx skills add Krusherk/zama-skill -g

# install only for specific agents
npx skills add Krusherk/zama-skill --agent claude-code codex cursor windsurf

# skip interactive prompts
npx skills add Krusherk/zama-skill -g -y

# update later
npx skills update zama-fhevm -g
```

It is designed so that when an AI coding agent is given this skill and a prompt such as:

- `Write me a confidential voting contract using FHEVM`
- `How do I build a confidential ERC-7984 token?`
- `Add frontend encryption and user decryption to this FHEVM app`

the agent has enough context, patterns, examples, and guardrails to produce correct, working code without interrupting the build to rediscover protocol basics.

## Why this is an all-in-one skill

Most FHEVM failures from coding agents come from fragmentation:

- architecture knowledge lives in one place
- Solidity patterns live in another
- frontend encryption flows live somewhere else
- decryption, ACL, and async settlement rules are easy to miss
- OpenZeppelin ERC-7984 behavior introduces another layer of nuance

This skill is built to solve that by packaging the full workflow in one coherent bundle.

The main [SKILL.md](./SKILL.md) is intentionally long and self-sufficient. It does not just summarize FHEVM. It instructs an agent how to:

- reason about FHEVM architecture
- choose the right encrypted types
- use `FHE` operations correctly
- handle ACL permissions safely
- ingest encrypted inputs with proofs
- implement user and public decryption
- integrate frontend encryption/decryption flows
- test in Hardhat mock mode
- deploy locally and on Sepolia
- use OpenZeppelin confidential contracts and ERC-7984 patterns
- avoid common FHEVM-specific mistakes

The supporting files make the skill stronger rather than thinner:

- `references/` expands protocol details the agent may need during deeper tasks
- `examples/` provides concrete Solidity, TypeScript, and frontend patterns
- `templates/` gives scaffold-ready starting points for new apps
- `validation/` shows how the skill maps to the bounty requirements and how it was checked
- `demo/` supports the final reviewer demo and video submission

## What the skill covers

This submission covers the full workflow required by the bounty:

- FHEVM mental model and offchain coprocessor execution
- Hardhat template setup
- encrypted types and operation support
- ACL patterns, including `FHE.allow`, `FHE.allowTransient`, and `FHE.allowThis`
- input proofs and caller binding
- mandatory `FHE.isSenderAllowed(...)` checks for direct ciphertext handles
- silent failure patterns and overflow-safe design
- user decryption with EIP-712 signing
- public decryption with async proof verification
- frontend integration through the current FHEVM JavaScript SDK flows
- testing patterns for mock and real-network workflows
- deployment guidance, wallet creation, and Sepolia network selection
- OpenZeppelin confidential contracts and ERC-7984
- anti-pattern prevention and completion checklist

## Network and deployment assumptions

As of April 25, 2026, the official Zama Protocol docs say the current real-encryption deployment target is Ethereum Sepolia.

This skill therefore teaches agents to:

- use `hardhat` for fast mock testing
- use `localhost` for persistent local integration work
- use `sepolia` for real FHEVM validation and reviewer-facing deployment
- create or use a dedicated Sepolia deployer wallet
- require Sepolia ETH for deployment
- ask the human to fund the wallet when no approved faucet automation exists

It also teaches the agent that normal confidential-contract deployment does not require `$ZAMA` tokens.

## Repository structure

- [SKILL.md](./SKILL.md): main long-form skill file
- [references](./references): deep protocol and workflow references
- [examples](./examples): compile-ready example contracts, tests, and frontend flows
- [templates](./templates): reusable scaffolds for generated work
- [scripts](./scripts): helper installers for Claude Code skill setup
- [validation](./validation): bounty crosswalk, prompts, reviewer runbook, and executed validation notes
- [demo](./demo): script support for the final video demonstration

If you want the easiest cross-agent install, prefer the `skills` CLI:

```bash
npx skills add Krusherk/zama-skill
```

Use the manual install methods below if you specifically want Claude-only placement or want to pin the repo in a custom location.

### Option 1: Clone directly into Claude's personal skills directory

This makes the skill available in every project on the machine.

1. Install Claude Code:

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

Or with npm:

```bash
npm install -g @anthropic-ai/claude-code
```

2. Clone this repository:

```bash
mkdir -p ~/.claude/skills
git clone https://github.com/Krusherk/zama-skill.git ~/.claude/skills/zama-fhevm
```

3. Start Claude Code in any project:

```bash
claude
```

Then invoke the skill directly:

```text
/zama-fhevm Write me a confidential voting contract using FHEVM
```

To update later:

```bash
git -C ~/.claude/skills/zama-fhevm pull
```

### Option 2: Clone anywhere and run the installer script

If you want the repo in a normal working directory first:

```bash
git clone https://github.com/Krusherk/zama-skill.git
cd zama-skill
./scripts/install-claude-skill.sh --personal
```

This installs the skill into `~/.claude/skills/zama-fhevm`.

### Option 3: Project install

This makes the skill available only inside a specific repo.

Clone the repo, then install it into a target project:

```bash
git clone https://github.com/Krusherk/zama-skill.git
cd zama-skill
./scripts/install-claude-skill.sh --project /path/to/target-project
```

This places the skill at `/path/to/target-project/.claude/skills/zama-fhevm/`, which matches the official project-skill layout. Project skills can then be committed and shared with a team through git.

### Option 4: Symlink install

If you want Git pulls in this repo to update the installed skill automatically:

```bash
git clone https://github.com/Krusherk/zama-skill.git
cd zama-skill
./scripts/install-claude-skill.sh --personal --link
```

This keeps Claude pointed at your cloned repo directly. Pulling new commits updates the installed skill automatically.

### Option 5: Project submodule install

If you want the skill tracked inside another repository:

```bash
cd /path/to/target-project
git submodule add https://github.com/Krusherk/zama-skill.git .claude/skills/zama-fhevm
```

This is a clean way to distribute the skill to a team because the target repo now carries the exact skill revision in the official project-skill path.

## Validation status

Executed validation is recorded in [validation/results.md](./validation/results.md).

In this environment, the example pack was validated in a temporary workspace derived from the official `fhevm-hardhat-template`, including:

- dependency installation
- contract compilation
- example test execution
- localhost deployment

The final real-agent recording and any Sepolia deployment proof should be performed using [validation/reviewer-runbook.md](./validation/reviewer-runbook.md).

## Fast review path

For judges reviewing the submission quickly, the fastest path is:

1. Read [SKILL.md](./SKILL.md)
2. Check [validation/bounty-crosswalk.md](./validation/bounty-crosswalk.md)
3. Inspect [examples](./examples)
4. Review [validation/results.md](./validation/results.md)
5. Use [validation/reviewer-runbook.md](./validation/reviewer-runbook.md) to reproduce the demo flow

## NOTE:FRONTEND USES REACT BUT SET TO HTML AS DEFAULT FOR QUICK FRONTEND DEMO PREVIE
