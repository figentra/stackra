# Feature Specification: spec gate and trace as published checks

**Created**: 2026-10-30

**Status**: Clarified

**Linear**: STA-1669

**Clarifications status**: complete

**Input**: `stackra check`'s spec phase runs `<repo>/tools/scripts/spec-gate.mjs` and `spec-trace.mjs` and skips when
they are absent, so product repos (OS, Commerce, the template) never run the spec checks. Approved by the leader on
2026-10-30: ship the read-only checks in `@stackra/repo-checks`, keep Linear in core.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/developer/repo-checks, packages/developer/cli
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: a dated Note on ADR 0282 (decision 4), pending the owner, who may ask for a formal amendment
- **New dependencies**: none
- **Deploy modes**: same everywhere
- **Licence tier**: free
- **Docs to update**: the repo-checks and cli README and AGENTS.md
- **Lane**: lite
- **Change risk**: R2 (changes the published CLI's check surface; core's own scripts must behave exactly as now)

## Behaviour

1. `@stackra/repo-checks/node` exports the read-only spec checks (folder shape, Impact questionnaire, stage and plan
   gates, tasks lint, lane, foreign status, bug lane, trace and drift) and one orchestrator returning `Finding`s. They
   print nothing and call no Linear or `pnpm` command. The issue key is derived: a folder `<prefix>-<n>-<slug>`, and
   keys elsewhere match only the prefixes the repo's spec folders use.
2. The CLI's spec phase calls the orchestrator whenever `.agents/specs` exists; it skips only without that folder.
3. Core's `tools/scripts/spec-gate.mjs`, `spec-trace.mjs` and `spec-parse.mjs` become wrappers over the package source
   (loaded by plain Node), keeping every export, mode, message prefix, exit code, env var and Linear side effect. The
   tripwire, branch check, `dir` and Linear stage comments stay in core.
4. A packed-file guard fails if `@stackra/repo-checks` or `@stackra/cli` would ship `linear.mjs`, `pnpm linear` or
   `STA-`.

## Status history

- 2026-10-30: Draft → Clarified (leader approved the proposal)
