# 3-Minute Demo Script

## 0:00 - 0:20

Introduce yourself and the problem:

- AI coding agents are great, but they do not natively understand FHEVM
- this skill pack gives them current Zama Protocol patterns, guardrails, tests, and templates

## 0:20 - 1:10

Show the skill package:

- `SKILL.md`
- `examples/`
- `templates/`
- `validation/`

Mention that the skill is Claude Code-native and designed to produce working FHEVM code from natural-language prompts.

## 1:10 - 2:05

Run the agent with one benchmark prompt:

- confidential voting
or
- ERC-7984 token

Briefly point out one generated safety pattern:

- `FHE.fromExternal(...)`
- `FHE.isSenderAllowed(...)`
- `FHE.allowThis(...)`
- actual transferred amount logic

## 2:05 - 2:40

Run proof commands:

- `npm run compile`
- `npm run test`
- `npx hardhat deploy --network localhost`

## 2:40 - 3:00

Close with:

- what tool the skill targets
- what the examples and templates cover
- how the skill prevents common FHEVM mistakes that generic agents often make
