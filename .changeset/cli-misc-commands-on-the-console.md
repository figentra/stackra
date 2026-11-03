---
"@stackra/cli": minor
---

`stackra ls`, `add`, `publish`, `agents sync`, `mcp sync`, `smoke`, `mobile onboard` and `consumer-gate` run as console command classes: the same flags, arguments and exit codes, with themed output and `--json` data (`ls` and `smoke` rows, the `add` item, the `consumer-gate` summary, the `mobile onboard` steps). `add` and `publish` run pnpm as a task instead of streaming it: its output shows under `--verbose` and when it fails, and `publish` prints it when it ends.
