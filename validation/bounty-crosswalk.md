# Bounty Crosswalk

## Requirements

### Accurate, up-to-date FHEVM knowledge

- Main agent instructions: [SKILL.md](../SKILL.md)
- Architecture: [references/01-mental-model.md](../references/01-mental-model.md)
- Types and operations: [references/02-encrypted-types-and-ops.md](../references/02-encrypted-types-and-ops.md)
- ACL, proofs, and decryption: [references/03-acl-and-input-proofs.md](../references/03-acl-and-input-proofs.md), [references/04-decryption-patterns.md](../references/04-decryption-patterns.md)

### Full workflow: write, test, deploy, frontend

- Contracts and patterns: [SKILL.md](../SKILL.md)
- Examples: [examples](../examples)
- Test/deploy/frontend guide: [references/05-frontend-testing-and-deployment.md](../references/05-frontend-testing-and-deployment.md)
- Greenfield frontend visual system and app-shell templates: [references/08-frontend-design-direction.md](../references/08-frontend-design-direction.md), [references/09-html-first-frontend-rule.md](../references/09-html-first-frontend-rule.md), [templates/frontend-fhevm-app-shell.html.tmpl](../templates/frontend-fhevm-app-shell.html.tmpl), [templates/frontend-fhevm-app-shell.tsx.tmpl](../templates/frontend-fhevm-app-shell.tsx.tmpl)
- Wallet creation, funding guidance, and Sepolia network selection: [SKILL.md](../SKILL.md), [references/05-frontend-testing-and-deployment.md](../references/05-frontend-testing-and-deployment.md)

### Correct Solidity and TypeScript/JavaScript examples

- Solidity examples: [examples/01-confidential-voting/ConfidentialVoting.sol](../examples/01-confidential-voting/ConfidentialVoting.sol), [examples/02-confidential-erc7984/ConfidentialToken.sol](../examples/02-confidential-erc7984/ConfidentialToken.sol), [examples/03-async-public-decryption/AsyncDisclosure.sol](../examples/03-async-public-decryption/AsyncDisclosure.sol)
- TypeScript examples: matching `*.test.ts` and `frontend.ts` files in `examples/`
- Templates: [templates](../templates)

### Works with at least one major AI coding tool

- Claude Code-compatible format: [SKILL.md](../SKILL.md) with YAML frontmatter
- Install/run instructions: [README.md](../README.md), [validation/reviewer-runbook.md](./reviewer-runbook.md)

### Tested and validated

- Benchmark prompts: [validation/benchmark-prompts.md](./benchmark-prompts.md)
- Executed results: [validation/results.md](./results.md)
- Reviewer runbook: [validation/reviewer-runbook.md](./reviewer-runbook.md)

## Topics To Cover

- FHEVM architecture and onchain/offchain model: `SKILL.md`, `references/01-mental-model.md`
- Hardhat template setup: `SKILL.md`, `references/05-frontend-testing-and-deployment.md`
- Encrypted types and operations: `SKILL.md`, `references/02-encrypted-types-and-ops.md`
- ACL and `FHE.allow` / `FHE.allowTransient`: `SKILL.md`, `references/03-acl-and-input-proofs.md`
- Input proofs: `SKILL.md`, `references/03-acl-and-input-proofs.md`
- User decryption: `SKILL.md`, `references/04-decryption-patterns.md`
- Public decryption: `SKILL.md`, `references/04-decryption-patterns.md`, `examples/03-async-public-decryption`
- Frontend integration and `fhevmjs` handling: `SKILL.md`, `references/05-frontend-testing-and-deployment.md`, `references/08-frontend-design-direction.md`, `references/09-html-first-frontend-rule.md`, `templates/frontend-encrypt-decrypt.*`, `templates/frontend-fhevm-app-shell.html.tmpl`, `templates/frontend-fhevm-app-shell.tsx.tmpl`
- Testing: `SKILL.md`, `references/05-frontend-testing-and-deployment.md`, `examples/*/*.test.ts`
- Anti-patterns and mistakes: `SKILL.md`, `references/07-anti-patterns-and-security-checklist.md`
- OpenZeppelin confidential contracts and ERC-7984: `SKILL.md`, `references/06-openzeppelin-erc7984.md`, `examples/02-confidential-erc7984`

## Judging Criteria

- Accuracy: source-of-truth and up-to-date patterns in `SKILL.md`
- Completeness: full lifecycle coverage in `SKILL.md`, `references/05-frontend-testing-and-deployment.md`, `references/08-frontend-design-direction.md`, and `examples/`
- Agent effectiveness: direct recipes in `SKILL.md`, scaffolds in `templates/`, prompts in `validation/benchmark-prompts.md`
- Code quality: compile-ready examples in `examples/`
- Structure: main skill plus references/examples/templates/validation/demo folders
- Error prevention: wrong/right patterns in `SKILL.md` plus `references/07-anti-patterns-and-security-checklist.md`
