---
"@stackra/cli": minor
---

`stackra ls`, `add`, `publish`, `agents sync`, `mcp sync`, `smoke`, `mobile onboard` and `consumer-gate` run as console command classes: the same flags, arguments and exit codes, with themed output and `--json` data (`ls` and `smoke` rows, the `add` item, the `consumer-gate` summary or setup error, the `mobile onboard` steps). `add` and `publish` run pnpm as a task instead of streaming it: its output shows under `--verbose`, its last 20 lines show under the task when it fails, and `publish` prints it when it ends. A failed pnpm run now exits 1 rather than with pnpm's own code.
