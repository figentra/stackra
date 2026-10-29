---
"@stackra/oxlint-config": patch
"@stackra/builder": patch
"@stackra/collaboration": patch
---

Fixes two bugs that broke consumers of 0.1.0 outside this repository:

- `@stackra/oxlint-config` loaded its JS plugins by monorepo-relative source paths, so `oxlint` failed with "Failed to
  load JS plugin" in every other repository. `base.jsonc` now loads them through two shipped loaders
  (`src/plugins/*.mjs`). Each one imports the plugin's source inside this repository and the published package
  (`@stackra/coding-standard`, `@stackra/feature-flags/lint`) everywhere else. Both packages are peers.
- `@stackra/builder/react` and `@stackra/collaboration/react` import `yjs`, but declared it as an optional peer, so a
  consumer without it failed with "Cannot find package 'yjs'". `yjs` is now a required peer.
