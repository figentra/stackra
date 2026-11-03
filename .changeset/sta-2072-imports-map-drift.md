---
"@stackra/cli": patch
---

`stackra validate --repository` now refuses a member whose `package.json` `imports` map is not the one its folders
imply (ADR 0233 decision 1): one `#<folder>/*` alias per `src/` folder but `__tests__` (or `#src/*` and
`#src/*.function` when `src/` holds a file directly), `#plugin/*` and `#scripts/*` for those root folders, and
`#stackra/*`, each array alias with the `*`, `*.ts`, `*.tsx` and `*/index.ts` targets in that order. The finding names
the aliases to add, remove and retarget. `tooling` presets are not checked.

`stackra new` writes the same map, from the folders it rendered, for every template kind but a tooling preset, so a
new app gets it too instead of the map its template carried.
