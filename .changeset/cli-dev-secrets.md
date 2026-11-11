---
"@stackra/cli": patch
"@stackra/infra-testbed": patch
---

A service whose configuration reads a required `@Secret` at boot starts under a local `stackra dev`. New command:
`stackra dev secrets init [--rotate] [--from <file>]` writes a random dev value for each required secret the
workspace's running members declare, and for each name a member's runway lists under `environments.dev.secrets`
(optional in the configuration or not), to `.stackra/dev-secrets.json` (gitignored, mode 600). It prints names, never a
value, and lists the names a random value would break (a connection string, the events relay's key pair) as needing
a value. An existing file only gains its missing names unless `--rotate`; `--from` copies a name shared with another
repository. `stackra dev` adds the file's values for a member's own declared names to its tool run. The testbed upload
excludes the file (ADR 0525, amendment of 2026-11-10).
