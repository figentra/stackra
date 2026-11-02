---
"@stackra/console": minor
---

The kernel routes every invocation to one intent (the list, the version, a command's help, a run or a usage
problem) before any container exists (STA-1966).

- `help <command>` prints the command's help and never runs it, as `--help` and `-h` already did. A command can no
  longer be named `help`.
- Spaced names run `:`-joined commands, longest match first, so `acme mcp sync` runs `mcp:sync`.
- `Command({ group, docs, examples })` is new:
  - the command list shows a command under its `group` (its namespace when it has none);
  - help ends with the examples and the docs link.
- Off a terminal, the command list starts with the name and version.
