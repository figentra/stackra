# Implementation Plan: the contract test tier, with an oasdiff check of every member's HTTP contract

**Spec**: `.agents/specs/sta-2837-contract-tier-oasdiff/spec.md` · **Linear**: STA-2837 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2837-contract-tier-oasdiff/spec.md`

## Summary

The contract tier follows the int tier: `contractTier` in `@stackra/vitest-config/contract`, a config gen writes into
`.stackra/` when a member has a `.contract.test.ts` (`emitTierConfig` and `hasTierTests` now serve both tiers), the
`contract` tier in `resolveTool` and at the workspace root, and the turbo task `test:contract`. The `oasdiff` check is a
CLI command, `stackra contract`: for each member whose manifest existed at the merge base, gen's `openApiOf` projects the
manifest on both sides, `inlineExternalSchemas` makes each projection self-contained, and `oasdiff breaking --format
json` lists the breaks; error-level breaks not excused by `tools/contract/accepted-breaks.yaml` are findings. The
Quality Gate runs it against `HEAD~1` (the base of the pull request's merge commit).

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: `packages/tooling/vitest`, `packages/developer/gen`, `packages/developer/cli`
- **Testing**: vitest in `src/**/__tests__/`; the contract tier on the pinned `oasdiff`; the gen goldens unchanged
- **Storage**: none
- **Runtime target**: developer machines, the Testbed and the Quality Gate

## Constitution Check

| Law                                   | Result | Note                                                       |
| ------------------------------------- | ------ | ---------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | the CLI calls gen's exported `openApiOf`; gen imports none |
| Secrets (ADR 0009)                    | N/A    | none                                                       |
| Security                              | PASS   | git and oasdiff run with argument arrays, no shell         |
| HTTP and events                       | N/A    | reads the HTTP contract, changes none                      |
| Tenancy                               | N/A    | none                                                       |
| Delegation                            | PASS   | Claude only                                                |
| Not built yet (ADR 0011)              | N/A    | none                                                       |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`; the tier infix names the tier       |
| Versions and catalogs                 | PASS   | changesets for vitest-config, gen and cli; oasdiff in mise |
| Deploy modes (ADR 0076)               | PASS   | same in all three                                          |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                  |
| Docs and ADRs                         | PASS   | ADR 0182 Enforcement; the two package READMEs              |

## Deploy modes

| Mode       | Behaviour                                                  |
| ---------- | ---------------------------------------------------------- |
| SaaS       | none at runtime; the check runs in development and CI only |
| On-prem    | the same                                                   |
| Air-gapped | the same; `oasdiff` is a local binary and fetches nothing  |

## Correctness properties

- **P-001**: `contractTier` replaces include and exclude with the contract globs and keeps every other setting —
  Validates: AC-001
- **P-002**: `hasTierTests` finds a tier's test only under `__tests__/` or gen's `.stackra/tests/`, never another tier's;
  `emitTierConfig` names the tier's wrapper and entry — Validates: AC-002
- **P-003**: `resolveTool` names `.stackra/vitest.contract.config.ts` for a package or service and refuses otherwise;
  the root runs `turbo run test:contract` — Validates: AC-003
- **P-004**: `memberContracts` projects exactly the members that had a manifest at the base, a removed one to no path —
  Validates: AC-004
- **P-005**: `inlineExternalSchemas` rewrites every external and transitive reference to a local component, each shape
  once — Validates: AC-005
- **P-006**: `contractFindings` fails error-level breaks only and lets an unexpired accepted break excuse its own
  member, operation and rule only — Validates: AC-004, AC-006
- **P-007**: the real `oasdiff` reports a removed operation and a new required field, and passes additions —
  Validates: AC-008

## Architecture overview

One projection (`openApiOf`) serves `openapi.json` and the check, so the check reads the contract gen commits. The
baseline is git, never a published artifact: the merge base for a branch, `HEAD~1` in CI. A host that mounts package
actions references the packages' shapes; the check resolves them on the same side, so the comparison is shape for shape.

## Components and responsibilities

- `contractTier`, `CONTRACT_TESTS` (`@stackra/vitest-config/contract`): the tier's vitest config.
- `emitTierConfig`, `hasTierTests` (gen): the generated tier configs, int and contract.
- `resolveTool`, `toolCommand` (cli): `stackra test --tier contract`.
- `ContractCommand` (cli): `stackra contract`, the base commit and the run date.
- `contractFindings`: the check; `memberContracts`: both sides of each member; `inlineExternalSchemas`: the mounted
  shapes; `oasdiffBreaks`: one `oasdiff` run; `loadAcceptedBreaks`: the accepted-breaks file.

## Files and folders

```text
packages/tooling/vitest/src/{contract.ts,constants/contract-tests.constant.ts,functions/contract-tier.function.ts} (+ test)
packages/tooling/vitest/{package.json,README.md}
packages/developer/gen/src/core/functions/emit-tier-config.function.ts (was emit-int-tier-config, + test)
packages/developer/gen/src/node/functions/has-tier-tests.function.ts (was has-int-tests, + test)
packages/developer/gen/src/node/functions/generate.function.ts
packages/developer/cli/src/node/commands/contract.command.ts (+ test)
packages/developer/cli/src/node/contract/{constants,types,functions}/ (+ tests, fixture, the contract-tier test)
packages/developer/cli/src/node/functions/{resolve-tool,tool-command}.function.ts (+ tests)
packages/developer/cli/src/node/constants/commands.constant.ts
packages/developer/cli/{package.json,README.md,stackra.manifest.json}
tools/contract/accepted-breaks.yaml
.github/workflows/ci.yml, turbo.jsonc, package.json, mise.toml
apps/docs/src/docs/adr/0182-testing-strategy-v2-tiers-coverage-infrastructure-and-policies.mdx
.changeset/contract-tier-oasdiff.md
```

## Data models and migrations

none

## Contracts

`tools/contract/accepted-breaks.yaml`: `accepted: [{ member, operation, id, issue, reason, added, expires }]`.

## Error handling

A missing `oasdiff` names the pin to install; an `oasdiff` failure or output that is not its JSON report is an error,
never an empty result; an unreadable manifest and a malformed accepted break are failed rows; a base with no merge base
is a usage error naming `fetch-depth 0` and `--base`.

## Security and tenancy

none: the check reads committed files and runs two local binaries with argument arrays.

## Testing strategy

- AC-001: `contract-tier.test.ts` (vitest-config).
- AC-002: `emit-tier-config.function.test.ts`, `has-tier-tests.function.test.ts`; the gen goldens (unchanged).
- AC-003: `resolve-tool.function.test.ts`, `tool-command.function.test.ts`.
- AC-004 to AC-006: `member-contracts.test.ts`, `inline-external-schemas.test.ts`, `contract-findings.test.ts`,
  `load-accepted-breaks.test.ts`, `oasdiff-breaks.test.ts`, `contract.command.test.ts`.
- AC-007: the Quality Gate on this pull request (actionlint and zizmor, then the step itself).
- AC-008: `oasdiff-breaks.contract.test.ts` (`pnpm --filter @stackra/cli test:contract`).

## Rollout

Patch changesets for `@stackra/vitest-config`, `@stackra/cli` and `@stackra/gen` (the fixed group's next release).
A product repository adds `"github:oasdiff/oasdiff" = "1.40.0"` to its `mise.toml` and runs `stackra contract` in CI
(the template follows in its own change).

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R2: the gate step was run on this tree against `origin/main` (clean) and
against `@stackra/identity@0.28.0` (31 real breaks found, the area moves since).

## ADRs

ADR 0182: Enforcement updated (the contract tier is enforced; the rest stays planned).

## Docs

ADR 0182, `packages/developer/cli/README.md`, `packages/tooling/vitest/README.md`.

## Complexity tracking

none
