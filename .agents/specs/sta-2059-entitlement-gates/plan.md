# Implementation Plan: gen gates calls by the entitlement option, quota meters, hosted entitlements and limits

**Spec**: `.agents/specs/sta-2059-entitlement-gates/spec.md` · **Linear**: STA-2059 · **Date**: 2026-11-03

**Input**: Feature specification from `.agents/specs/sta-2059-entitlement-gates/spec.md`

## Summary

Type the `entitlement` option on `ActionOptions` and `QueryOptions`, then move gen's gate computation in
`buildManifest` to after the hosted sections merge, so one pass gates every entitlement entry (the member's and its
hosted packages') from every action entry: a limit by its counted model's create key, a quota by the meter an action
feeds, and any entitlement by the keys an action names. Names resolve against the member's classes first and the
dependency manifests second; an unresolved name is refused.

## Technical Context

- **Language**: TypeScript (ESM), Node 24 (`mise.toml`)
- **Members**: `packages/application/actions` (`tier:lib`), `packages/developer/gen` (`tier:lib`)
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022)
- **Storage**: none
- **Runtime target**: a library (gen runs at build time; the actions change is a type only)

## Constitution Check

| Law                                   | Result | Note                                                      |
| ------------------------------------- | ------ | --------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | actions types the option structurally; no new import      |
| Secrets (ADR 0009)                    | N/A    | no secret is read or named                                |
| Security                              | PASS   | closes a fail-open: a named plan right now gates its call |
| HTTP and events                       | N/A    | no endpoint or event changes                              |
| Tenancy                               | N/A    | no tenant-owned data                                      |
| Delegation                            | PASS   | one agent, one worktree, gen and actions only             |
| Not built yet (ADR 0011)              | PASS   | nothing from the table is introduced                      |
| Test placement (ADR 0022)             | PASS   | tests beside their subjects in `__tests__/`               |
| Versions and catalogs                 | PASS   | no dependency or catalog change                           |
| Deploy modes (ADR 0076)               | PASS   | build-time only, same in all three                        |
| Licence tier (ADR 0077)               | PASS   | free packages                                             |
| Docs and ADRs                         | PASS   | gen and actions READMEs updated; implements accepted ADRs |

## Deploy modes

| Mode       | Behaviour                                                      |
| ---------- | -------------------------------------------------------------- |
| SaaS       | gen writes the gates; the plan driver checks them at call time |
| On-prem    | the same gates; the licence source answers the grants          |
| Air-gapped | the same gates; the licence source answers the grants          |

## Correctness properties

- **P-001**: An action or query naming an entitlement class compiles; one naming a non-entitlement class does not —
  Validates: FR-001
- **P-002**: For every action entry naming key K in `entitlements`, the entitlement entry with key K lists the action's
  key in `gates` — Validates: FR-002, FR-004
- **P-003**: A quota's `gates` equal exactly the keys of the action entries whose `meter` equals the quota's meter —
  Validates: FR-003
- **P-004**: A limit whose counted model is hosted records the hosted model's key and gates the actions (kind
  `action`) whose key starts with `<model key>.create@` — Validates: FR-005
- **P-005**: An unresolved `entitlement` class or `counts` class yields exactly one refusal naming the declaring class —
  Validates: FR-006, FR-007
- **P-006**: A member with no `entitlement` option, quota or metered action produces the same manifest as before —
  Validates: FR-002, FR-003 (example-only: the committed manifests)

## Architecture overview

`buildManifest` (gen) builds the action entries, then the entitlement entries, then merges the hosted sections of
`ir.dependencies` into `sections`. Today gates are computed inside the entitlement loop over local actions only, before
the merge, so hosted entries and meters are never seen. The change: the action loop records what each call names and
feeds, the entitlement loop records what each entitlement counts or meters, and the gates are computed once over
`sections.entitlements` × `sections.actions` after the merge. A package (no merge) runs the same pass over its own
sections; a host recomputes over its own and merged entries, keeping each merged entry's own gates.

## Components and responsibilities

- `ActionOptions`, `QueryOptions` (actions): the `entitlement?: EntitlementOption` field, typed
  `AnyClass<{ readonly "~kind": "entitlement" }> | readonly AnyClass<{ readonly "~kind": "entitlement" }>[]`.
- `buildManifest` (gen):
  - `entitlementOf(value)`: a named class resolves to a local entitlement's derived key (`entitlementKey`) or to the key
    of the dependency manifest entitlement with that class from the dependency whose package is the class's `from` (or
    its prefix); otherwise `undefined`.
  - `modelOf(value)`: the same for a counted model (`modelKey`, or the dependency manifest model's `key`).
  - action loop: `entry.meter` from `options.meter.name`; `entry.entitlements` from `entitlementOf` over the option,
    refusing `entitlement_unknown` for an unresolved item.
  - entitlement loop: `counts` from `modelOf` (refusing `entitlement_counts_unknown`), `meter` and `per` for a quota; no
    gates here.
  - after the merge: one pass setting `gates` on every entry of `sections.entitlements`.
- `entitlementKey` (gen): unchanged; its test gains cases.

## Files and folders

- `packages/application/actions/src/core/types/action-options.type.ts` — `entitlement`
- `packages/application/actions/src/core/types/query-options.type.ts` — `entitlement`
- `packages/application/actions/src/core/bases/__tests__/action.base.test.ts`, `query.base.test.ts` — type cases
- `packages/developer/gen/src/core/functions/build-manifest.function.ts` — resolution, recording, the gate pass
- `packages/developer/gen/src/core/functions/__tests__/build-manifest.function.test.ts` — entitlement gate cases
- `packages/developer/gen/src/core/functions/__tests__/entitlement-key.function.test.ts` — more key cases
- `packages/developer/gen/README.md`, `packages/application/actions/README.md` — docs
- `.changeset/*.md` — minor for `@stackra/actions` and `@stackra/gen`

## Data models and migrations

none

## Contracts

- `ActionOptions.entitlement?`, `QueryOptions.entitlement?` (additive type fields).
- Manifest action entry: `entitlements?: string[]`, `meter?: string` (written only when declared).
- Manifest entitlement entry: `meter?: string`, `per?: string` for a quota; `gates` unchanged in shape.
- No action key, event name or permission changes.

## Error handling

- `entitlement_unknown` (subject: the action or query; fix: import an `Entitlement` class this member declares or a
  hosted package ships).
- `entitlement_counts_unknown` (subject: the entitlement; fix: count a model this member declares or a hosted package
  ships).
- Both are build errors of `buildManifest`, reported like `effect_unknown`; nothing is written past a refusal.

## Security and tenancy

No permission or tenant change. The change removes a fail-open: an action that names a plan right, feeds a quota's
meter or creates a counted hosted model now carries the gate the plan driver checks.

## Testing strategy

- AC-001: type cases in the actions bases tests (`@ts-expect-error` for a non-entitlement class), run by the package
  typecheck and vitest.
- AC-002 to AC-006: `build-manifest.function.test.ts`, extending the STA-903 case and adding a hosted-dependency IR
  (a dependency manifest with an entitlement, a model and its create action).
- SC-002: `stackra gen --check` over the repo on ci-box (no committed manifest changes).

## Rollout

none (no committed member uses the new paths; a release note in the changeset)

## Delegation and risk plan

One agent, worktree `.claude/worktrees/sta-2059`; heavy runs on ci-box. Risk: STA-2045 edits `build-manifest`'s
policies section and STA-2025 the action loop; merge origin/main before shipping and keep their behaviour.

## ADRs

ADR 0215 (decision 1), ADR 0216 (decision 3), ADR 0294 (decisions 16 and 20), all Accepted. No draft opened.

## Docs

packages/developer/gen/README.md (entitlements bullet), packages/application/actions/README.md (options).

## Complexity tracking

none
