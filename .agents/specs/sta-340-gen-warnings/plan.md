# Implementation Plan: gen warnings, and ADR 0101's action-first checks

**Spec**: `.agents/specs/sta-340-gen-warnings/spec.md` · **Linear**: STA-340 · **Date**: 2026-11-03

**Input**: Feature specification from `.agents/specs/sta-340-gen-warnings/spec.md`

## Summary

`GenError` gains an optional `severity: "warning"`. `formatGenError` prints the word from it. `generateMember` splits
the full pass's findings: errors block as today, warnings travel beside the files in a new `warnings` field, which
`generate` passes through in `GenerateResult.warnings`. The CLI's `runGen` prints warnings and keeps its outcome. A
new pure `checkActionFirst(ir)` holds ADR 0101's two checks, fed by one new reader fact, `DeclaredClass.workflows`.

## Technical Context

- **Language**: TypeScript (ESM), Node 24 (`mise.toml`)
- **Members**: `packages/developer/gen` (`tier:lib`), `packages/developer/cli` (`tier:lib`)
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022), the gen goldens (`__golden__/`)
- **Storage**: none
- **Runtime target**: a library (gen) and the `stackra` CLI

## Constitution Check

| Law                                   | Result | Note                                          |
| ------------------------------------- | ------ | --------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | cli already imports gen; no new imports       |
| Secrets (ADR 0009)                    | N/A    | no secret is read or named                    |
| Security                              | N/A    | a build-time check                            |
| HTTP and events                       | N/A    | no endpoint or event                          |
| Tenancy                               | N/A    | no tenant data                                |
| Delegation                            | PASS   | one agent, one worktree                       |
| Not built yet (ADR 0011)              | PASS   | nothing new introduced                        |
| Test placement (ADR 0022)             | PASS   | `__tests__/` beside each subject              |
| Versions and catalogs                 | N/A    | no dependency change                          |
| Deploy modes (ADR 0076)               | N/A    | build-time check                              |
| Licence tier (ADR 0077)               | PASS   | free                                          |
| Docs and ADRs                         | PASS   | ADR 0101 Enforcement line; gen AGENTS.md line |

## Deploy modes

| Mode       | Behaviour                |
| ---------- | ------------------------ |
| SaaS       | same: a build-time check |
| On-prem    | same                     |
| Air-gapped | same                     |

## Correctness properties

- **P-001**: `formatGenError(e)` and `formatGenError({ ...e, severity: "warning" })` differ only in the word `error` and `warning` — Validates: FR-001, FR-002
- **P-002**: for any full-pass result, `errors` holds no warning and `warnings` holds only warnings — Validates: FR-003
- **P-003**: `runGen` resolves the same with or without warnings added to a result — Validates: FR-004
- **P-004**: an action without a cross-boundary dependency, or one that starts a workflow, never gets `action_without_workflow` — Validates: FR-005
- **P-005**: a class of a kind outside controller, command and listener never gets `workflow_without_action` — Validates: FR-006
- **P-006**: `DeclaredClass.workflows` holds exactly the names ending in `Workflow` passed first to a `.run(` call in the class text, and is absent when there is none — Validates: FR-007

## Architecture overview

```text
source reader ──(DeclaredClass.workflows)──► MemberIR
generateMember full pass: [...ir.errors, ...checks, ...checkActionFirst(ir)] ──split by severity──►
    errors (block, as today)        warnings (returned beside the files)
generate ──► GenerateResult { errors, warnings, files, changed } ──► runGen prints both; outcome from errors only
```

## Components and responsibilities

- `GenError` (`gen/core/types/gen-error.type.ts`): `readonly severity?: "warning"`.
- `formatGenError`: `${at} ${error.severity ?? "error"} ${code} ...`.
- `DeclaredClass.workflows?: readonly string[]` and the reader: the names matching `\.run\s*\(\s*([A-Z]\w*Workflow)\b`
  in the class text, set only when non-empty (like `callerReads`).
- `checkActionFirst(ir)` (`gen/core/functions/check-action-first.function.ts`): pure; constants for the outbound
  token (`ConnectionStore` from `@stackra/integrations`), the runner token (`WorkflowRunner` from
  `@stackra/actions/contracts`) and the adapter kinds (`controller`, `command`, `listener`); it reuses
  `CLIENTS_SPECIFIER`.
- `generateMember`: adds `...checkActionFirst(ir)` to the full-pass list, then splits `all` into errors and warnings
  before its "nothing is written" return; both returns carry `warnings`.
- `generate`: passes `result.warnings` through on every return after the full pass; earlier returns leave it out.
- `GenerateResult.warnings?: readonly GenError[]`, optional, so the docs-site run (`generateDocsSite`, owned by
  STA-2026) and the early returns stay unchanged; `runGen` reads it as `warnings = []`.
- `runGen` (cli): prints each warning to stderr in the two-line form before the errors; the outcome is unchanged.
- Barrel: `checkActionFirst` added to `gen/src/core/index.ts` and its list in `core/__tests__/index.test.ts`.

## Files and folders

- `packages/developer/gen/src/core/types/gen-error.type.ts`
- `packages/developer/gen/src/core/types/declared-class.type.ts`
- `packages/developer/gen/src/core/functions/format-gen-error.function.ts`
- `packages/developer/gen/src/core/functions/check-action-first.function.ts` (new)
- `packages/developer/gen/src/core/functions/generate-member.function.ts`
- `packages/developer/gen/src/core/index.ts`, `src/core/__tests__/index.test.ts`
- `packages/developer/gen/src/node/types/generate-result.type.ts`
- `packages/developer/gen/src/node/functions/generate.function.ts`
- `packages/developer/gen/src/node/functions/create-source-reader.function.ts`
- `packages/developer/cli/src/node/functions/run-gen.function.ts`
- Tests: `gen/src/core/functions/__tests__/format-gen-error.function.test.ts`,
  `gen/src/core/functions/__tests__/check-action-first.function.test.ts` (new),
  `gen/src/core/functions/__tests__/generate-member.function.test.ts`,
  `cli/src/node/functions/__tests__/run-gen.function.test.ts`
- Docs: `apps/docs/src/docs/adr/0101-action-first-workflow-behind-when-needed.mdx`, `packages/developer/gen/AGENTS.md`
- `.changeset/gen-warnings.md` (gen minor, cli patch)

## Data models and migrations

none

## Contracts

Additive only: `GenError.severity?`, `GenerateResult.warnings`, `generateMember(...).warnings`,
`DeclaredClass.workflows?`, export `checkActionFirst`. Codes: `action_without_workflow` (warning) and
`workflow_without_action` (error), each with a fix.

## Error handling

A warning never empties `files`; an error does, as today. The manifests and clients passes return before the
full-pass checks, so they never carry warnings.

## Security and tenancy

none

## Testing strategy

- `format-gen-error.function.test.ts`: the warning form (AC-001).
- `check-action-first.function.test.ts`: each trigger of `action_without_workflow` (client, sibling service,
  `ConnectionStore`) and its silences (a workflow started, a query, a same-module service, a sibling config); each
  trigger of `workflow_without_action` (`WorkflowRunner` dep, workflow-class dep, body start) and a non-adapter kind
  (AC-004 to AC-006).
- `generate-member.function.test.ts`: an IR with only a warning writes files and returns it in `warnings`.
- `run-gen.function.test.ts`: a warning-only result resolves true with and without `check`; an error resolves false
  (AC-002, AC-003), with `generate` mocked as the existing tests do.
- The golden test stays green: the golden service reports neither code (AC-007). The golden runner records each
  run's warnings beside its refusals (with `severity: "warning"`), so a warning in any fixture shows up as a diff.
- `create-source-reader.function.test.ts`: the `workflows` fact (P-006, EC-03).
- Runs on ci-box: gen and cli test, typecheck and lint.

## Rollout

A minor changeset for `@stackra/gen` and a patch for `@stackra/cli` (the `@stackra/*` packages are versioned
together).

## Delegation and risk plan

One agent; gen and cli. Touches `generate-member` (one line in the full-pass list and the split) and
`create-source-reader` (one fact beside `callerReads`); clear of emit-boot, emit-registrations and build-manifest
(STA-2044 to STA-2047). Merge origin/main in before shipping. Size M.

## ADRs

ADR 0101 (decisions 1 and 3, Enforcement, the 0294 note), ADR 0294 (decisions 22 and 26), ADR 0308 (the managed
client), ADR 0260 (generated clients) — accepted.

## Docs

ADR 0101's two "planned" lines name the codes; gen's AGENTS.md says a warning never blocks writing.

## Complexity tracking

none
