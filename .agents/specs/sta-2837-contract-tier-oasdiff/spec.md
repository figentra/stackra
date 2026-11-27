# Feature Specification: the contract test tier, with an oasdiff check of every member's HTTP contract

**Feature Branch**: `figentra/sta-2837-contract-tier-oasdiff`

**Created**: 2026-11-26

**Status**: Implementing

**Tier**: feature

**Approver**: leader

**Linear**: STA-2837

**Clarifications status**: complete

**Input**: ADR 0182 decisions 1 and 4 (accepted 2026-10-20): a `.contract` test tier with its own turbo task, and
`oasdiff` contract checks. The 26 Nov production-readiness audit (batch 14, item 14.1) found neither: no
`*.contract.test.ts`, no `test:contract` task, and no `oasdiff` in the tooling, so a change that removes an endpoint or
makes an input field required merges unnoticed. Split out of STA-229 (whose coverage gate batch 7 owns).

### Sources

- `apps/docs/src/docs/adr/0182-testing-strategy-v2-tiers-coverage-infrastructure-and-policies.mdx`
- `packages/developer/gen/src/core/functions/open-api-of.function.ts` (the manifest's OpenAPI projection, ADR 0158)
- `packages/developer/gen/src/node/functions/generate.function.ts` (the int tier config, STA-1819)
- `packages/developer/cli/src/node/functions/resolve-tool.function.ts`, `tool-command.function.ts`
- `packages/tooling/vitest/src/functions/int-tier.function.ts` (the pattern `contractTier` follows)
- `.github/workflows/ci.yml` (the Quality Gate), `turbo.jsonc`, `mise.toml`
- `oasdiff` 1.40.0 (`oasdiff breaking --format json`): reads the OpenAPI 3.1 projection; a reference to another
  package's shape (`@stackra/identity#/schemas/…`, which a host that mounts package actions carries) fails to load as a
  file, so the check inlines those shapes first

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/tooling/vitest, packages/developer/gen, packages/developer/cli
- **Public contract change**: `@stackra/vitest-config` gains the `./contract` entry (`contractTier`, `CONTRACT_TESTS`);
  `@stackra/cli` gains `stackra contract` and `stackra test --tier contract`; gen writes
  `.stackra/vitest.contract.config.ts` for a member with a `.contract.test.ts`; the root gains `pnpm test:contract`
  and the turbo task `test:contract`; the Quality Gate gains the step `HTTP contracts (oasdiff)`
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none (reads committed manifests only)
- **Secrets**: none
- **ADR needed**: no; ADR 0182's Enforcement section records what is now enforced
- **New dependencies**: the `oasdiff` binary, pinned in `mise.toml` as `github:oasdiff/oasdiff` 1.40.0 (Apache-2.0);
  no npm dependency
- **Deploy modes**: same in all three (a development and CI check; nothing ships to a runtime)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: ADR 0182 (Enforcement), `packages/developer/cli/README.md`, `packages/tooling/vitest/README.md`
- **Lane**: full
- **Change risk**: R2 (a new required check in the Quality Gate; a false positive blocks every pull request)

## Acceptance criteria

- **AC-001**: THE `./contract` entry of `@stackra/vitest-config` SHALL export `contractTier`, which narrows a member's
  config to `CONTRACT_TESTS` (`src/**/__tests__/**/*.contract.test.{ts,tsx}` and `.stackra/tests/**/*.contract.test.ts`)
  and keeps its preset, aliases and setup.
- **AC-002**: WHEN gen runs for a member with a `.contract.test.ts` THE output SHALL include
  `.stackra/vitest.contract.config.ts`, the generated unit config wrapped in `contractTier`. The test counts when it is
  authored under `src/**/__tests__/` or written by gen under `.stackra/tests/`; the int tier's config stays byte for
  byte as before.
- **AC-003**: WHEN `stackra test --tier contract` runs in a package or service THE CLI SHALL run vitest on that config,
  refuse with the reason when gen wrote none or the member is an app, and at the workspace root run
  `turbo run test:contract`.
- **AC-004**: WHEN `stackra contract` runs THE CLI SHALL compare every workspace member that had a
  `stackra.manifest.json` at the merge base of HEAD and `--base` (default `origin/main`) with the same member in the
  working tree, through `oasdiff breaking` on each side's OpenAPI projection, and fail with one row per error-level break
  named by the member folder, operation and oasdiff rule; warnings never fail.
- **AC-005**: WHEN a host's projection references a mounted package's shape THE check SHALL inline that shape from
  the package's manifest on the same side (the workspace member's, else the installed copy), so a package's breaking
  shape change fails each host that mounts it. Such a reference has the form `<package>#/schemas/<name>`.
- **AC-006**: WHEN an unexpired accepted break names a break's member, operation and rule THE check SHALL excuse it.
  Accepted breaks live in `tools/contract/accepted-breaks.yaml`. An expired entry excuses nothing and the row says when
  it expired; a malformed entry (missing field, no issue key, `expires` more than 30 days after `added`, `added` in the
  future) is a failed row.
- **AC-007**: THE Quality Gate SHALL install the pinned `oasdiff` and run `stackra contract --base HEAD~1` on every pull
  request after the manifests are checked against gen.
- **AC-008**: THE contract tier SHALL hold a real `.contract.test.ts` that runs the pinned `oasdiff`: a removed
  operation and a new required input field are breaks, an added operation and an optional field are not.
- **AC-009**: WHEN a member that had a manifest at the base has none in the working tree THE check SHALL fail each
  operation it had as an error-level break (`api-path-removed-without-deprecation`), one row per operation.
- **AC-010**: THE `servicePreset` unit project and the `libraryPreset` unit, react and native projects SHALL exclude
  `CONTRACT_TESTS`, so a `.contract.test.ts(x)` runs only in the contract tier, never in the unit tier.

## Status history

- 2026-11-26 → Clarified (ADR 0182 decisions 1 and 4; audit item 14.1; split from STA-229)
- 2026-11-26 → Planned (plan.md)
- 2026-11-26 → Tasked (tasks.md)
- 2026-11-26 → Implementing (written from what was built)
- 2026-11-27 → Planned (plan.md) — Approved by Idris (CTO) 2026-11-27
