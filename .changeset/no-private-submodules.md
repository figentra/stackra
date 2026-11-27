---
"@stackra/repo-checks": minor
"@stackra/flow-preset": patch
"@stackra/cli": patch
---

`stackra validate --repository` refuses a git submodule nobody declared as public (STA-2918, ADR 0526 decision 4).
`git clone --recursive` fetches every submodule, so a private one breaks the clone for everyone outside the team. The
`layout` rule now reads the root `.gitmodules`: each submodule needs its path in package.json
`stackra.layout.submodules` with the reason anyone can clone it, and an https or relative URL (no ssh, local path or
user info; a finding masks user info as `***`). A declaration with no submodule behind it is reported as stale.
`@stackra/repo-checks` exports `checkSubmodules`, `submodulesOf` and the type `Submodule`. `@stackra/flow-preset`'s
workspace-layout rule and EAS skill no longer list a `.notes` folder.

Upgrading: a repository that keeps a public submodule adds
`"stackra": { "layout": { "submodules": { "<path>": "<why anyone can clone it>" } } }` to its root package.json, or
removes the submodule.
