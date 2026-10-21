# Contributing

The working rules live in [`AGENTS.md`](AGENTS.md) and `.agents/rules/`; the full guides are in `apps/docs`
(`pnpm docs`). The short version:

1. `mise install`, then `pnpm install`.
2. Track the work in Linear (team `STA`). Branch names come from Linear: `figentra/sta-<n>-<slug>`.
3. Versions come only from `pnpm-workspace.yaml` catalogs or `workspace:*`. Tests sit in `src/**/__tests__/`.
4. Use conventional commits. A `feat`, `fix`, `refactor` or `perf` commit carries `Refs: STA-n`.
5. `pnpm verify` must be green (format, lint, typecheck, test, build, validate, boundaries, knip).
6. Open a pull request using the template. A separate reviewer approves; nobody merges their own change.

Report security issues privately, as described in [`SECURITY.md`](SECURITY.md).
