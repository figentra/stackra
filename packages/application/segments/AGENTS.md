<!-- Purpose: the agent rules of @stackra/segments: where code goes, entries, the package rules and PII. Boundary: documentation of packages/application/segments only. Runtime: none (Markdown). Governing contract: ADR 0332; ADR 0462. -->

# AGENTS — @stackra/segments

Named audiences over any subject model, dynamic (a `@stackra/rules` rule set) or manual, with materialised membership
and `MembershipEntered`/`MembershipLeft` integration events (ADR 0332). Member at `packages/application/segments`
(`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries `./contracts`, `.`, `./node`, `./testing`.

## Where code goes

| You are writing…                                | It goes in…                                         |
| ----------------------------------------------- | --------------------------------------------------- |
| A type or enum a consumer stores or implements  | `src/contracts/{types,enums}/`                      |
| An integration event, a refusal, a shipped `X$` | `src/core/{events,errors,constants}/`               |
| A model, a migration                            | `src/node/models/`, `src/node/database/migrations/` |
| A service, the job, its input, the registration | `src/node/{services,actions,schemas,functions}/`    |
| A testing helper or plugin                      | `src/testing/`                                      |
| A `Permissions` class                           | `src/node/access/<model>.permissions.ts`            |
| A driver of another package's port              | `src/node/drivers/`                                 |
| A test                                          | `__tests__/<name>.<kind>.test.ts` beside it         |

## Entries and barrels

- `src/{contracts,core,node,testing}/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add
  every new public file to its barrel and to that entry's `index.test.ts`.
- `src/contracts/` is the leaf; `core` imports it, `node` imports `core`, `testing` imports `node`. Nothing in `.`
  touches a database.
- The event and input schemas (`*-schema.constant.ts`) mirror their classes by hand until gen compiles this package's
  schemas; change both together.

## This package

- Never evaluate a condition tree here except through `evaluate` of @stackra/rules (ADR 0331 decision 1), and never let
  a consumer evaluate a segment's rule set: consumers read `SegmentMembershipService` (ADR 0332 decision 5).
- Name no subject model and no commerce word: a subject is a registered model key (`SubjectRef`).
- Every membership write goes through `SegmentMembershipService.enter`/`leave`, which record the events on the rows and
  flush, so the outbox writes them in the same transaction under the scope session open at that moment.
- A recompute runs in the segment's scope: the job is queued with the segment's scope, and `recomputeSubject` opens
  `withScope` per segment. Never open a scope session in a method a caller's action runs (`add`, `remove`, `publish`):
  the settings would last for the rest of the caller's transaction.
- No tenant word is declared here (final review R-59, ADR 0323): a scope is a `ScopeRef`. "Hook" is a React word only:
  the row-change seam is a change consumer.
- No parameter properties and no `#private` fields: services typecheck this source under `erasableSyntaxOnly`. Never
  import `@mikro-orm/*` (ADR 0097 decision 2).

- Segments is an add-on above @stackra/iam and @stackra/rules (ADR 0462 decision 1): it depends on both, and neither
  may ever depend on it. Business rules target a segment through `SEGMENT_FACTS` and `SegmentFactProviderDriver`
  (the rules `FactProvider` port), never through an IAM audience.
- Every action declares its permission in a `Permissions` class here; a job's permission is system-held
  (`Permission.Lx.system()`).

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII

| Data         | Where                                             | Handling                                                                  |
| ------------ | ------------------------------------------------- | ------------------------------------------------------------------------- |
| Segment name | `segments.segments.name`                          | Written by a person of the scope; no personal data expected               |
| Membership   | `segments.segment_memberships.subject_id`, events | A subject's public id and model key only; never its facts                 |
| Facts        | process memory during a recompute                 | Computed by the subject's owner, evaluated and dropped; never stored here |
