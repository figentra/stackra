---
"@stackra/infra-testbed": patch
---

The job image pins `shfmt` (from `mise.toml`, which `pnpm format:check` runs) and the Encore CLI at the products'
`1.58.8` through mise, instead of the Encore installer's latest release. The image's validate step checks every tool a
job calls at its pin and launches headless Chromium, and the host's checks the SSM agent.

A job and the seed refresh now upload `.agents`: `pnpm validate` reads its specs, hooks, rules and skills, so a
`pnpm verify` on the testbed failed without it. A test keeps the agent's list equal to the contract's.

The image's pnpm store is warmed from the lockfile and `pnpm-workspace.yaml` together (`pnpm fetch` refused the
lockfile alone over its catalogs, so the first build shipped an empty store), and a failed warm-up now fails the build.
