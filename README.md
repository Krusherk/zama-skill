## Zama FHEVM Skill Pack

This repository is a production-focused `SKILL.md` bundle for AI coding agents that need to build, test, deploy, and review confidential smart contracts on the Zama Protocol.

Primary target:

- Claude Code project or personal skills via `.claude/skills/zama-fhevm/`

What is in this pack:

- [SKILL.md](/home/crack/Documents/zama/SKILL.md): the main long-form skill file
- [references/01-mental-model.md](/home/crack/Documents/zama/references/01-mental-model.md): architecture and execution model
- [references/02-encrypted-types-and-ops.md](/home/crack/Documents/zama/references/02-encrypted-types-and-ops.md): encrypted types, operations, and HCU/gas tradeoffs
- [references/03-acl-and-input-proofs.md](/home/crack/Documents/zama/references/03-acl-and-input-proofs.md): ACL rules, proofs, caller binding, and AA caveats
- [references/04-decryption-patterns.md](/home/crack/Documents/zama/references/04-decryption-patterns.md): user and public decryption flows
- [references/05-frontend-testing-and-deployment.md](/home/crack/Documents/zama/references/05-frontend-testing-and-deployment.md): frontend, test, and deploy guidance
- [references/06-openzeppelin-erc7984.md](/home/crack/Documents/zama/references/06-openzeppelin-erc7984.md): OpenZeppelin confidential token and wrapper guidance
- [references/07-anti-patterns-and-security-checklist.md](/home/crack/Documents/zama/references/07-anti-patterns-and-security-checklist.md): mistake-prevention reference
- [examples/01-confidential-voting](/home/crack/Documents/zama/examples/01-confidential-voting): confidential voting contract, tests, and frontend flow
- [examples/02-confidential-erc7984](/home/crack/Documents/zama/examples/02-confidential-erc7984): ERC-7984 confidential token, tests, and frontend flow
- [examples/03-async-public-decryption](/home/crack/Documents/zama/examples/03-async-public-decryption): async public-decryption contract and tests
- [templates](/home/crack/Documents/zama/templates): scaffold files for new confidential apps
- [validation](/home/crack/Documents/zama/validation): bounty crosswalk, reviewer runbook, prompts, and execution results
- [demo](/home/crack/Documents/zama/demo): video script and shot list for the submission video

## Claude Code Install

Copy this folder to:

```bash
mkdir -p ~/.claude/skills/zama-fhevm
cp -R /home/crack/Documents/zama/* ~/.claude/skills/zama-fhevm/
```

Then use it either automatically or explicitly:

```text
/zama-fhevm Write me a confidential voting contract using FHEVM
```

## Design Goals

- The main skill file is intentionally long so an agent can work without external doc hunting.
- Supporting files exist because the bounty requires examples, templates, validation material, and clear separation of deep references.
- The skill defaults to the official FHEVM Hardhat template and current `FHE` APIs.
- If a user says `fhevmjs`, the skill interprets that as the frontend FHEVM JavaScript SDK layer and follows the repo’s existing SDK or the current official relayer flow.

## Submission Bundle

For the repo you submit, the core bundle should stay in version control:

- [SKILL.md](/home/crack/Documents/zama/SKILL.md)
- [references](/home/crack/Documents/zama/references)
- [examples](/home/crack/Documents/zama/examples)
- [templates](/home/crack/Documents/zama/templates)

I recommend also keeping these in the repo because they strengthen the submission and make judging easier:

- [validation](/home/crack/Documents/zama/validation)
- [demo](/home/crack/Documents/zama/demo)

What is usually not stored as a normal repo file:

- the final recorded video asset itself

The actual video is typically uploaded or linked separately for the submission, while the `demo/` and `validation/` markdown files stay in the repo as reviewer guidance and evidence.

## Validation Notes

Executed validation lives in [validation/results.md](/home/crack/Documents/zama/validation/results.md).

The repository does not fabricate Claude Code runs in this environment. The final real-agent demo should be recorded using [validation/reviewer-runbook.md](/home/crack/Documents/zama/validation/reviewer-runbook.md).
