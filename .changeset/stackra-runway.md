---
"@stackra/cli": minor
"@stackra/runway": minor
---

`stackra runway <command>` runs every Runway command (ADR 0529 decision 4): the same options, exit codes and `--json`
output as the `runway` binary, which now prints a deprecation notice and stays only as an alias for one minor release.
`@stackra/runway/node` exports `RUNWAY_COMMANDS`.
