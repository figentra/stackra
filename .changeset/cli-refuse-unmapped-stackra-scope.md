---
"@stackra/cli": patch
---

`stackra doctor` and `stackra create` refuse a Stackra scope that would install from the public npm registry, where
anyone can publish under that name (ADR 0453). The doctor reads the package manager's effective config (`pnpm config
get`) for `@stackra`, and for `@stackra-pro` when the workspace uses it, and fails the new `<scope> scope mapped` row
when the scope is unmapped or mapped to a public registry (npmjs, Yarn, npmmirror, GitHub Packages), printing the exact
`.npmrc` line to add; a scope mapped to another host is a warning. `stackra create` writes both scope lines, refuses a
starter `.npmrc` that maps a Stackra scope to a public registry, and checks the new app's effective config (its
`.npmrc`, `~/.npmrc` and the `registries` of its `pnpm-workspace.yaml`) before it installs, stopping with the line to
fix. `stackra new` writes the `@stackra-pro` line next to the `@stackra` one in a new workspace root (STA-2900).
