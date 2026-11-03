---
"@stackra/cli": minor
---

The repository checks `stackra any-ratchet`, `app-native-deps`, `cycles`, `duplicate-exports`, `doc-standard`,
`catalogue-completeness`, `skill-licences`, `agents check`, `duplication` and `architecture-map --check` now run on
`@stackra/console`: each finding is a failed checklist row (on standard output, with an "N errors" summary), a clean run
prints one success line, `--json` writes `{ ok, data }` whose data is the findings array, and any finding still exits 1.
The notes about lowered `any` baselines and stale duplicate-export allow-list entries are warnings on standard error.
`stackra duplication --update` and `stackra architecture-map` say what they wrote, and `architecture-map` shows archify's
output only when it fails, exiting with archify's code. `stackra structure` still prints the page unchanged (`{ page }`
under `--json`) and `--write-docs` writes it. Every flag, positional and exit code is unchanged.
