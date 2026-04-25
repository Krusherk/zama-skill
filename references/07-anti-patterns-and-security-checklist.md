# Anti-Patterns And Security Checklist

Use this file for reviews, audits, or final contract completion checks.

## Anti-patterns

1. Using `FHE.allow()` where `FHE.allowTransient()` is correct
2. Missing `FHE.isSenderAllowed()` on direct-handle external inputs
3. Comparing requested amount instead of transferred amount
4. Forgetting to delete async request state before external calls
5. Arithmetic overflow without encrypted guards
6. Public decryption without finality delay for economically sensitive values
7. Arbitrary external calls from privileged contexts
8. Encrypting inputs for third-party callers instead of direct callers
9. Transient-storage collision under account abstraction
10. Missing `FHE.allowThis()` after storing or updating handles
11. Exposing plaintext in public views instead of returning encrypted handles
12. Inventing legacy APIs instead of `FHE.fromExternal(...)`
13. Using encrypted divisors with `div` or `rem`

## Review questions

- Does every stored handle get `FHE.allowThis(...)`?
- Are users granted persistent access only when they need private decryption later?
- Are same-tx helper permissions transient?
- Does every direct handle input verify sender authorization?
- Are fresh user inputs always ingested through `externalE*` plus proof?
- Is any secret-dependent revert path hiding in the code?
- Is arithmetic protected where wraparound would break business logic?
- Are public decrypt requests final outputs only?
- Is async state deleted before external interaction?
- Are public proof handle orders and ABI orders aligned?
- If a token or wrapper is involved, is the actual transferred amount used for settlement logic?

## Completion gate

Do not mark the contract done until:

- compile passes
- tests pass in mock mode
- deploy flow is documented
- frontend encryption/decryption flow is documented
- every anti-pattern above has been checked off or explicitly ruled out
