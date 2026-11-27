---
"@stackra/cli": patch
"@stackra/repo-checks": patch
---

`stackra create` writes the registry it fetched the starter from (`--registry`, `STACKRA_REGISTRY`, else the Stackra
registry) into the new app's `.npmrc`, and moves every scope line the starter maps to the default registry with it, so
an app made from a mirror or a local registry installs from that registry too. `@stackra/repo-checks` knows the one
unscoped member, `create-stackra`, the `npm create stackra` initializer (ADR 0199, amendment of 2026-11-27; STA-2897).
