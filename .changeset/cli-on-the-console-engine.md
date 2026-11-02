---
"@stackra/cli": minor
---

`stackra` now runs on `@stackra/console`. Help, `help <command>`, unknown commands (exit 2, with the closest names),
errors and the version render through the console, so `-v` is `--verbose` and the version is `-V` or `--version`.
`stackra doctor` is a grouped checklist (Machine, Tools, Repo, Registries, Accounts) whose `--json` output is the rows
unchanged, `run` included, and a failed row exits 1. `stackra create` shows each step as a task (a failed step shows the
tail of its output) and gen's summary as a tree. The local MCP serves `doctor` from its command definition. The
other commands keep their flags and output unchanged and run as passthrough commands until they are converted.
