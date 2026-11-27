---
"@stackra/cli": patch
"@stackra/console": patch
---

New workspaces and console apps map `@stackra` to the registry's main host, `https://npm.figentra.com/` (STA-2892).
The registry keeps answering on `https://npm.stackra.figentra.com/`, permanently, and names tarballs on the host a
request came in on, so an existing `.npmrc` or lockfile keeps working. `stackra doctor` probes the main host and the
host the workspace `.npmrc` names.
