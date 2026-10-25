# Feature Specification: `@stackra/rules` wave 6, one condition engine

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-25

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/rules` (application, wave 6, before iam), the new package of ADR 0331: one engine that
evaluates conditions for every rule consumer (segments, discounts, pricing rules, related products, automations,
visibility rules). A condition tree of `all`, `any` and `not` over `field operator value` leaves; operator sets fixed per
field type; fact sources registered by consumers; versioned rule sets on `HasRevisions`; deterministic evaluation with
the time as a fact; explanations by tree path; a rule-builder component. Add `HasRevisions` to `@stackra/content`, which
ADR 0321 makes its owner, as the smallest addition the rule sets need.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `packages/application/rules` (new member); `packages/data/content` (the `HasRevisions` trait,
  the `Revision` model and its migration)
- **Cross-service events**: none (`RuleSetPublished` is a domain event, dispatched in process)
- **Tenancy and data**: `rules.rule_sets` and `content.revisions`, each keyed by `scope_id` with a denormalised
  `scope_path` under forced row-level security on `app.scope_paths`; no tenant vocabulary (R-59, ADR 0323)
- **Secrets**: none
- **ADR needed**: no (ADR 0331 decides the package, ADR 0321 the trait owner); the gaps are listed under Open items
- **New dependencies**: none outside the workspace and the catalogs (`zod` from the default catalog); runtime edges to
  content, contracts, database, errors, events, i18n, model, money, ui and validation
- **Deploy modes**: same code in all; no network, clock or environment read in the engine
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/application/rules/README.md`, `packages/application/rules/AGENTS.md`, `packages/data/content/README.md`, `packages/data/content/AGENTS.md`; ADR 0331 and 0321 are cited and amended only by a note if a decision here changes
- **Lane**: lite
- **Change risk**: R2 (new public contract every rule consumer and IAM rely on, and two tenant-facing tables)

## Clarifications

### Session 2026-10-25

The package follows ADR 0331, the wave 9 registry row and the owner decisions of 2026-10-24 (programming model v3 and
v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- Registry row: `.` Rules, RuleSet, Condition, evaluate; `./contracts` FactSource and the operator sets; `./react`
  RuleBuilder. `RuleSet` is a MikroORM model, so it is exported from `./node` (as content's models are) and `.` stays
  isomorphic; the template imports nothing from the package
- Operator sets: `Operator` (26 snake_case codes, each with the shape of its value) and `FieldType` (string, number,
  money, date, enum, list, geo), whose case data is each type's frozen operator set; both in `./contracts`, the leaf, so
  IAM reuses them without the engine (decision 11)
- Fact sources are typed descriptions (`FactSource`, `FactField` with a lang-key label and, for an enum, its codes); the
  consumer computes the facts and passes them; a field path is `<source>.<field>`
- `Rules.create({ key, sources })` is one consumer's registry; `check` is the trust boundary for tenant rules (at most
  200 nodes and 8 levels, registered fields, the type's operators, fitting values) and refuses with field errors by node
  path; `evaluate` checks again, so a stale stored rule is refused rather than guessed
- One reading of a missing fact: it matches `is_not_set` only; strings compare exactly; money in another currency fails
  with `currency_mismatch`; ranges are inclusive; durations are read as `@stackra/validation`'s `duration` does
- Rule sets: `RuleSet` (`rset_`, scope, consumer key) carries `HasRevisions`; each condition is a frozen, numbered
  revision in `content.revisions`; publishing stamps a revision and records `RuleSetPublished`; the current revision is
  the one published last, so publishing an older one rolls back
- `HasRevisions` in `@stackra/content` (ADR 0321): the trait (no column), the `Revision` model and migration `0002`;
  no shared revision service, `Publishable` or `Schedulable` yet
- The builder is web only (`@stackra/ui/react`, free components), controlled, and worded from the package's `rules`
  catalogue in English and Arabic
- Owner, 2026-10-24 (R-59, ADR 0323): no tenant vocabulary; rule sets are keyed by `ScopeRef` from `@stackra/contracts`

## User Scenarios & Testing

### User Story 1 - Register facts and check a tenant's rule (Priority: P1)

A promotions module registers its cart and customer facts; a tenant's condition from the builder is checked before it
is stored, and a bad node is refused with its path.

**Independent Test**: `src/core/values/__tests__/rules.value.test.ts`,
`src/core/functions/__tests__/fits-operand.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** a condition naming an unregistered field, **When** it is checked, **Then** `condition_invalid` names the
   node's path with `field_unknown`.
2. **Given** a string field and `less_than`, **When** it is checked, **Then** the node is `operator_not_allowed`.

### User Story 2 - Evaluate deterministically with an explanation (Priority: P1)

A consumer evaluates a condition against its facts at a time it supplies and gets the result and every node's step.

**Independent Test**: `src/core/functions/__tests__/evaluate.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** the same condition, facts, time and revision, **When** it is evaluated twice, **Then** the results are
   equal.
2. **Given** an `all` with a failing leaf, **When** it is evaluated, **Then** the steps name the failing leaf's path.
3. **Given** a missing fact, **When** any operator but `is_not_set` tests it, **Then** the leaf fails with `missing`.

### User Story 3 - Version a rule set (Priority: P1)

A consumer opens a rule set, drafts revisions and publishes one; evaluations use the published revision and name it.

**Independent Test**: `src/node/services/__tests__/rule-set.service.test.ts`,
`packages/data/content/src/node/**/__tests__/*revision*.test.ts`.

### User Story 4 - Build a rule (Priority: P2)

A tenant edits a condition in the rule builder, which offers only the registered fields and their types' operators.

**Independent Test**: `src/react/rule-builder/__tests__/rule-builder.test.tsx`.

### Edge Cases

- An empty `all` holds; an empty `any` does not.
- A money range in two currencies, a reversed range and a zero duration: `value_invalid`.
- A fact of the wrong form (a string for a number field): a `TypeError`, the consumer's bug.
- A draft for another consumer's rule set: `not_found`.
- Two drafts at once: the second refuses `rule_set_changed` (409, retryable).
- A stored condition naming a field the consumer no longer registers: `condition_invalid` at evaluation.

## Requirements

- **FR-001**: The package SHALL be `@stackra/rules` at `packages/application/rules`, `tier:lib`, entries
  `./contracts`, `.`, `./node` and `./react` only.
- **FR-002**: `./contracts` SHALL export `Operator` and `FieldType` with one fixed, frozen operator set per field type,
  and the `FactSource`, `FactField` and `GeoPoint` types, importing no other entry.
- **FR-003**: `Rules.create` SHALL register fact sources by field path and throw on a misdeclared source; `check` SHALL
  accept only a bounded tree of registered fields, their types' operators and fitting values, and refuse otherwise with
  `ConditionInvalidError` naming each node by path.
- **FR-004**: `evaluate` SHALL be deterministic in its condition, facts, time and revision, read no clock, match a
  missing fact only with `is_not_set`, and explain every node by path, naming the revision.
- **FR-005**: `RuleSetService` SHALL open rule sets per consumer and scope, store each checked condition as a new
  numbered revision, publish a revision with `RuleSetPublished`, and evaluate the published or a stated revision.
- **FR-006**: `@stackra/content` SHALL export `HasRevisions` and `Revision` from `./node`, with the
  `content.revisions` migration under forced row-level security.
- **FR-007**: `RuleBuilder` SHALL offer only registered fields and the operators of a field's type, and report every
  edit as a whole condition.
- **FR-008**: No evaluation, check or builder path SHALL evaluate code, and no identifier under the package's `src`
  SHALL contain `tenant`.

## Success Criteria

- **SC-001**: Spec, plan, tasks and a changeset exist.
- **SC-002**: Every public symbol has a test in `src/**/__tests__/`; the tests run in the separate testing workflow
  (owner mode, 2026-10-24: not run here).
- **SC-003**: `oxfmt` and `oxlint` are clean on the package and the validator reports nothing for it; the typecheck
  waits for the integrator's install (a new package).

## Open items (for the owner, not blocking)

- A boolean field type: ADR 0331 fixes seven types; a yes-or-no fact is an enum of two codes until an ADR adds one.
- Gen (STA-340): the planned check of seeded rule sets (unregistered field, foreign operator) and the oxlint rule
  against other evaluators; gen's typed lang keys replace the builder's stand-in key constant.
- `@stackra/content` has no shared revision service yet: rules writes its revisions through `Repository<Revision>`;
  `Publishable` and `Schedulable` (ADR 0321 decision 6) build on the same table later.
- A Postgres integration test (row-level security on both tables, the unique revision index) runs with the testing
  workflow.

## Status history

- 2026-10-25 · — → Implementing · Claude (package-builder) · spec for a package written in owner mode (develop now, test later)
