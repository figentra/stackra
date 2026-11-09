---
"@stackra/repo-checks": minor
---

`stackra validate --repository` gains an `optional-peers` check. It refuses a library file that statically imports a value from an optional peer outside a platform entry, which is how 0.32.0's `@stackra/config/node` broke every consumer without `@aws-sdk/client-secrets-manager` installed.

These are not refused:

- a platform entry (`src/react`, `src/native`, `src/desktop`, `src/browser`, `src/worker`, `src/e2e`, `src/testing`) importing its platform's peers;
- React, React DOM and React Native;
- type-only imports;
- required peers.

The fix it names is a dynamic `await import()` where the peer is first needed.
