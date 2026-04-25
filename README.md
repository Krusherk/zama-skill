# Zama FHEVM All-In-One Skill

This repository is a submission for Zama's bounty to create production-ready AI coding skills for confidential smart contract development.

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

The main [SKILL.md](/home/crack/Documents/zama/SKILL.md) is intentionally long and self-sufficient. It does not just summarize FHEVM. It instructs an agent how to:

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

- [SKILL.md](/home/crack/Documents/zama/SKILL.md): main long-form skill file
- [references](/home/crack/Documents/zama/references): deep protocol and workflow references
- [examples](/home/crack/Documents/zama/examples): compile-ready example contracts, tests, and frontend flows
- [templates](/home/crack/Documents/zama/templates): reusable scaffolds for generated work
- [validation](/home/crack/Documents/zama/validation): bounty crosswalk, prompts, reviewer runbook, and executed validation notes

## Primary tool compatibility

This skill is packaged in a Claude Code-compatible `SKILL.md` format with YAML frontmatter.

That makes it directly usable as a major AI coding tool skill, while the content and supporting files are also structured in a way that can be adapted to other agent ecosystems.

## Validation status

Executed validation is recorded in [validation/results.md](/home/crack/Documents/zama/validation/results.md).

In this environment, the example pack was validated in a temporary workspace derived from the official `fhevm-hardhat-template`, including:

- dependency installation
- contract compilation
- example test execution
- localhost deployment

The final real-agent recording and any Sepolia deployment proof should be performed using [validation/reviewer-runbook.md](/home/crack/Documents/zama/validation/reviewer-runbook.md).

## Fast review path

For judges reviewing the submission quickly, the fastest path is:

1. Read [SKILL.md](/home/crack/Documents/zama/SKILL.md)
2. Check [validation/bounty-crosswalk.md](/home/crack/Documents/zama/validation/bounty-crosswalk.md)
3. Inspect [examples](/home/crack/Documents/zama/examples)
4. Review [validation/results.md](/home/crack/Documents/zama/validation/results.md)
5. Use [validation/reviewer-runbook.md](/home/crack/Documents/zama/validation/reviewer-runbook.md) to reproduce the demo flow
