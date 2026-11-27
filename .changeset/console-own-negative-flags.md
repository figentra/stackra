---
"@stackra/console": patch
---

A boolean option named `no-<x>` beside an option `<x>` is read as itself: `stackra dev --no-infra` sets `noInfra`,
where `node:util.parseArgs` read it as the negation of `--infra <names>` (STA-2883).
