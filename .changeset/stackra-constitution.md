---
"@stackra/repo-checks": minor
"@stackra/cli": minor
"@stackra/flow-preset": patch
---

`stackra constitution` writes `.flow/constitution.md` (the file Figentra Flow's `flow-*` commands read) from the docs
laws, and `stackra validate --repository` reports it missing or out of date (`constitution`). It was rendered by core's
agents-sync script, which retires now that Flow projects `.agents/` (STA-2098 H6).

The stackra preset's workspace-layout rule and guard hint name the docs site as Fumadocs on a Worker (ADR 0514), not
Mintlify.
