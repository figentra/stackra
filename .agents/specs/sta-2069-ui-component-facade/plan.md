# Implementation Plan: gen writes the `#stackra/ui` class-component facade

**Spec**: `.agents/specs/sta-2069-ui-component-facade/spec.md` · **Linear**: STA-2069 · **Date**: 2026-11-03

**Input**: Feature specification from `.agents/specs/sta-2069-ui-component-facade/spec.md`

## Summary

Class components import `Component` from `#stackra/ui`, and the compiler strips that import, but no emitter writes
`.stackra/gen/ui.ts`, so tsc cannot resolve it. A new pure emitter, `emitUiFacade(ir)`, returns one re-export,
`export { Component } from "@stackra/ui/<entry>";`, for a member that declares `@stackra/ui`, with the entry chosen by
the existing `clientRuntimes(ir)`. `generateMember` adds it to its list of optional `.stackra/gen/` files.

## Technical Context

- **Language**: TypeScript (ESM), Node 24 (`mise.toml`)
- **Members**: `packages/developer/gen` (`tier:lib`)
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022); the golden runner `src/node/__tests__/golden.test.ts`
- **Storage**: none
- **Runtime target**: a library (gen, run by the CLI); the generated file is read by tsc only

## Constitution Check

| Law                                   | Result | Note                                                                            |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | gen only; the facade re-exports a public entry of a package the member declares |
| Secrets (ADR 0009)                    | PASS   |                                                                                 |
| Security                              | PASS   | one type-level re-export; no runtime path                                       |
| HTTP and events                       | N/A    | no action, query, endpoint or event changes                                     |
| Tenancy                               | N/A    | no table or scope change                                                        |
| Delegation                            | PASS   |                                                                                 |
| Not built yet (ADR 0011)              | PASS   | no shared web and native component library: each runtime keeps its own entry    |
| Test placement (ADR 0022)             | PASS   | the test sits in `core/functions/__tests__/`                                    |
| Versions and catalogs                 | PASS   | no dependency or catalog change                                                 |
| Deploy modes (ADR 0076)               | PASS   | same in all three                                                               |
| Licence tier (ADR 0077)               | PASS   | free                                                                            |
| Docs and ADRs                         | PASS   | the gen README rows; no ADR needed (ADR 0305 rule 37 and ADR 0261 decide it)    |

## Deploy modes

| Mode       | Behaviour                         |
| ---------- | --------------------------------- |
| SaaS       | same: a generated type-level file |
| On-prem    | same                              |
| Air-gapped | same                              |

## Correctness properties

- **P-001**: The facade exists exactly when `ir.packages` includes `@stackra/ui` — Validates: FR-001, FR-003
- **P-002**: The entry is `native` exactly when `clientRuntimes(ir)` is `["native"]`, and `react` otherwise —
  Validates: FR-002
- **P-003**: The file body is the generated header followed by one `export { Component } from ...;` line —
  Validates: FR-004

## Architecture overview

```
ir.packages ∋ "@stackra/ui" ──► emitUiFacade(ir) ──► .stackra/gen/ui.ts ◄── #stackra/* imports map ◄── tsc
clientRuntimes(ir) ───────────────┘ (react | native)
```

## Components and responsibilities

- `emitUiFacade` (new, `src/core/functions/emit-ui-facade.function.ts`): pure; returns the file text or undefined.
  Uses `generatedHeader` and `clientRuntimes`, as the other emitters do.
- `generateMember`: one row, `[".stackra/gen/ui.ts", emitUiFacade(ir)]`, in its `optional` list.
- `COMPONENT_MODULE` (`src/node/constants/component-module.constant.ts`): its contract comment names the emitter that
  writes the module; the value does not change.

## Files and folders

`packages/developer/gen`:

- `src/core/functions/emit-ui-facade.function.ts` (new)
- `src/core/functions/__tests__/emit-ui-facade.function.test.ts` (new)
- `src/core/functions/generate-member.function.ts` (one row and the contract comment)
- `src/core/index.ts` and `src/core/__tests__/index.test.ts` (the `emitUiFacade` export)
- `src/node/constants/component-module.constant.ts` (contract comment)
- `__golden__/app-clients/input/apps/web/package.json.golden` (`@stackra/ui` dependency, `#stackra/*` import alias)
- `__golden__/app-clients/input/apps/web/src/components/greeting/greeting.component.tsx.golden` and
  `greeting.props.ts.golden` (new: a class component and its props)
- `__golden__/app-clients/input/_modules/@stackra/ui/` (new stand-in: `package.json` with `./react` and `./native`,
  and a `Component<P>` declaration)
- `__golden__/app-clients/expected/apps/web/.stackra/gen/ui.ts.golden` (new) and whatever else the refresh shows
- `README.md` (the `.` entry table and the generated-files table)
- `.changeset/sta-2069-ui-component-facade.md` for `@stackra/gen`

## Data models and migrations

none

## Contracts

- `.stackra/gen/ui.ts` (`#stackra/ui`), additive: `export { Component } from "@stackra/ui/react";` (or
  `/native`), under the standard generated header; gen's `.` entry exports `emitUiFacade`. No manifest changes.

## Error handling

No new refusal. A member without `@stackra/ui` gets no file (EC-01), so a class component there still fails tsc with
"cannot find module `#stackra/ui`", which names the missing piece. The file only imports a package the member
declares, so `generated_dependency_missing` never fires for it.

## Security and tenancy

none

## Testing strategy

- AC-001, AC-002, AC-003: `emit-ui-facade.function.test.ts`: a web app, a package and a web plus iOS app get the
  `react` entry; an iOS and Android app gets `native`; a member without `@stackra/ui` and an IR with no `packages`
  get undefined; the body is the header plus one export line. Tests carry `@covers sta-2069:FR-###`.
- AC-004: the golden `app-clients` fixture, refreshed with `UPDATE_GOLDEN=1` on ci-box and reviewed by diff.
- AC-005: on ci-box, after the golden run, `tsc --noEmit -p` over the golden cache of `apps/web`
  (`.cache/golden/app-clients/apps/web`) with the class component; the output goes on the PR. The script stays
  untracked.

## Rollout

A patch changeset for `@stackra/gen`. Members that declare `@stackra/ui` get the gitignored file on their next gen
run; nothing committed is regenerated.

## Delegation and risk plan

One agent, one pull request, gen only. Every install, gen, typecheck and test runs on ci-box. Risk: a one-line
conflict in `generate-member.function.ts` with sessions adding emitters; merge `origin/main` in before shipping.

## ADRs

ADR 0305 (rules 37 to 41: class components, `Component` from `#stackra/ui`), ADR 0261 and ADR 0233 (`#stackra/<name>`
is a real file in `.stackra/gen/`), ADR 0249 and ADR 0295 (decisions 7 and 8: client runtimes per target). All
Accepted.

## Docs

`packages/developer/gen/README.md`: an `emitUiFacade` row in the `.` entry table and a `.stackra/gen/ui.ts` row in the
generated-files table.

## Complexity tracking

none
