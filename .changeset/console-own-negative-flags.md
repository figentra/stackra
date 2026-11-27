---
"@stackra/console": patch
---

`--no-<x>` is read as its own flag only when a boolean option declares `no-<x>` (`noInfra` is `--no-infra`), where
`node:util.parseArgs` read it as the negation of `<x>`; any other `--no-<x>` still negates the boolean `--<x>`. A
command that declares both `<x>` and `no-<x>` is a `ConsoleDeclarationError` (STA-2883).
