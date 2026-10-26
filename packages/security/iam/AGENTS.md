# AGENTS — @stackra/iam

Permissions, policies, roles and the embedded policy decision point (ADR 0208, 0132, 0333). Member at
`packages/security/iam` (`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries `.`,
`./contracts`, `./node`, `./react`, `./testing`.

## Where code goes

| You are writing…                              | It goes in…                                 |
| --------------------------------------------- | ------------------------------------------- |
| A port or a policy-as-data type               | `src/contracts/{ports,types,enums}/`        |
| A kind base (`Permissions`, `Policy`, `Role`) | `src/core/bases/`                           |
| An enum, a value, a registration function     | `src/core/{enums,values,functions}/`        |
| A driver (pipeline, scope, memory source)     | `src/core/drivers/`                         |
| The decision point or the client snapshot     | `src/core/services/`                        |
| An internal registry                          | `src/core/constants/`                       |
| The record-visibility query filter (server)   | `src/node/{drivers,functions,types}/`       |
| A hook                                        | `src/react/permission/`                     |
| A test helper or the testing plugin           | `src/testing/constants/`                    |
| A test                                        | `__tests__/<name>.<kind>.test.ts` beside it |

## Entries and barrels

- `src/{contracts,core,node,react,testing}/index.ts` are stand-in barrels until gen writes the entry barrels
  (STA-339); add every new public file to its barrel and to that entry's `index.test.ts`.
- `src/contracts/` is the leaf; `core` imports `contracts`; `node`, `react` and `testing` import `core` through
  `#core/index`.
- `.` stays isomorphic: anything that reaches `@stackra/database` or `@stackra/model` (server only) goes in `./node`.
- The registries (`PERMISSION_REGISTRY`, `ROLE_REGISTRY`, `POLICY_REGISTRY`, `VISIBILITY_REGISTRY`) stay internal;
  never export them.
- `SegmentRef` is `@stackra/segments/contracts`' own; import it from there and never redeclare or re-export it.
  segments must never depend on iam.
- A contracts type a shape field may name ships its schema next to it, exported as `<Type>$` (`Audience$`, built on
  `@stackra/validation`'s `ScopeRef$`; ADR 0294 decision 26, STA-1284).

## This package

- Fail closed: an unknown scope node, an unconnected policy, a policy answer that is not a `Decision`, an unreachable
  source or a conditional deny without a fact source refuses or errors, never allows.
- A refusal to the caller is `ForbiddenError` with no reason; the `AccessExplanation` is for the audit only.
- Conditions are `@stackra/rules` trees evaluated by its `evaluate`; write no evaluator of condition trees here
  (ADR 0331 decisions 1 and 11). The one other reading is `whereOf` (`./node`), which translates a checked condition
  into a read's filter with `evaluate`'s semantics (a missing value matches `is_not_set` only); keep the two in step
  when rules adds an operator or a field type.
- Visibility never invents a default for a record no rule matches: `visibility` answers `Decision.Abstain`, and
  `visibleCondition` takes `unmatched` from the `registerVisibility` row, which has no default (ADR 0333 decision 7).
- The visibility filter only narrows: never add an option, flag or decorator that skips it (ADR 0333 d5, ADR 0327).
- A restricted permission never counts through a self-made grant; break-glass passes only `breakable` denies; a
  dimension value not in the projection fails closed. Durations and walls are data (settings, rules), never numbers here.
- No tenant vocabulary (R-59): scopes are the contracts `ScopeRef`. The access-control driver reads the call's
  `scope`; never read the descriptor's `tenantId` (it is going away).
- No parameter properties and no `#private` fields: apps typecheck this source under `erasableSyntaxOnly`.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII

| Data         | Where                                  | Handling                                                       |
| ------------ | -------------------------------------- | -------------------------------------------------------------- |
| Principal id | `Actor`, `AccessExplanation.principal` | A public id; passed to the source and the audit, never logged. |
| Segment ids  | `PolicySnapshot.segments`              | Membership references only; never logged.                      |
| Record facts | `RecordFacts.facts`                    | Read for one evaluation and dropped; never stored or logged.   |
| Rule values  | the filter `whereOf` builds            | Bound as query parameters; never written into SQL or logged.   |
