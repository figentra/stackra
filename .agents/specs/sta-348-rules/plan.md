# Plan: `@stackra/rules` wave 6

**Spec**: `.agents/specs/sta-348-rules/spec.md`

## Design

- Four entries through stand-in barrels (STA-339 replaces them): `./contracts` (the leaf: `Operator`, `FieldType` and the
  fact source types), `.` (isomorphic: `Rules`, `evaluate`, the types, the refusals, `RuleSetPublished`), `./node`
  (`RuleSet`, `RuleSetService`) and `./react` (`RuleBuilder`).
- `FieldType`'s case data is each type's operator set, frozen and typed `readonly Operator[]`; `Operator`'s case data is
  the shape of its value (none, one, many, range, duration, circle). A new operator is one case, one place in the sets,
  one operand rule and one evaluator branch.
- `Rules` is a value built with `create`: a map of field path to `FactField`. `problems(input)` walks the tree by hand
  (node count and depth bounded, leaf keys strict) and asks `fitsOperand` about each leaf's value; `check` throws its
  result as `ConditionInvalidError`.
- `evaluate` checks the tree, then walks it in pre-order, keeping a step per node; each leaf reads its fact by source and
  field key, refuses a fact of the wrong form, and applies one comparator for ordered types (number, money minor units,
  date milliseconds), a text test, a list test or the haversine distance.
- `RuleSet` carries `HasRevisions`; `RuleSetService` injects `Repository<Revision>` and writes revisions under the model
  key `rules.rule_set`, numbering after the stored count, a unique-index race refused as `rule_set_changed`.
- `@stackra/content` gains the `HasRevisions` trait (no column), `Revision` (`rev_`, scope, model key, record id,
  number, `data` jsonb, nullable `published_at`) and migration `0002-create-revisions`.
- `RuleBuilder` composes `ConditionEditor` (group, negation, leaf) and `OperandEditor` (a Select or CheckboxGroup for an
  enum, text fields read in the field's type) on `@stackra/ui/react`, worded from `assets/lang/{en,ar}/rules.json`.

## Constitution Check

| Law                                   | Result | Note                                                                                                          |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/application/rules`; imports only `tier:lib` packages; no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                           |
| Security                              | PASS   | tenant rules are data checked at the boundary; no code evaluation; values reach Postgres as ORM parameters    |
| HTTP and events                       | PASS   | no endpoint; one domain event; refusals are `validation` and `conflict`                                       |
| Tenancy                               | PASS   | both tables keyed by `ScopeRef` under forced row-level security; no tenant words                              |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) runs the tests        |
| Not built yet (ADR 0227)              | PASS   | no expression language, no rules engine dependency; data that references registered code only                 |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                     |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                             |
| Deploy modes (ADR 0076)               | PASS   | one build in SaaS, on-prem and air-gapped                                                                     |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                            |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; ADR 0331 and 0321 stand, the gaps are listed in the spec            |

- Boundaries: runtime imports of content, contracts, database, errors, events, i18n, model, money, ui and validation;
  dev-only `@stackra/container`, `@stackra/testing`, Testing Library and the tooling presets.
- Versions: catalogs and `workspace:*` only.
- Naming: refusals end in `Error`, the event `RuleSetPublished` has no suffix, the value `Rules` is built with `create`,
  props live in `<name>.props.ts`, whole words (`operator`, `latitude`, `radiusKilometres`).

## Properties

- **P-001**: `package.json` names `@stackra/rules` at `packages/application/rules` and `exports` lists only `.`, `./contracts`, `./node` and `./react` — Validates: FR-001
- **P-002**: the contracts `index.test.ts` lists exactly `FieldType` and `Operator`, every type's set is frozen with the presence tests, and every operator is in some set — Validates: FR-002
- **P-003**: for every input, `check` returns it unchanged exactly when `problems` is empty, and otherwise throws `condition_invalid` whose field errors equal `problems` — Validates: FR-003
- **P-004**: for every condition, facts, time and revision, two evaluations are equal, a missing fact matches only `is_not_set`, and the steps hold one entry per node, root first — Validates: FR-004
- **P-005**: for every sequence of drafts, revision numbers increase by one per rule set, a draft for another consumer is `not_found`, and publishing records one `RuleSetPublished` — Validates: FR-005
- **P-006**: `@stackra/content/node` exports `HasRevisions` and `Revision`, and the `0002` migration compiles `content.revisions` with its unique index and forced policy — Validates: FR-006
- **P-007**: for every registry and condition, the builder's field list is `Rules.fields()` and its operator list is the field type's set — Validates: FR-007
- **P-008**: no `eval`, `Function` or `tenant` identifier appears under `packages/application/rules/src` — Validates: FR-008

## Deploy modes

| Mode       | Behaviour                                                                          |
| ---------- | ---------------------------------------------------------------------------------- |
| SaaS       | the same build; rule sets and revisions live in each service's Postgres schemas    |
| On-prem    | identical: the same build, no SaaS-only code path                                  |
| Air-gapped | identical: needs no network; evaluation is in process and Postgres holds the rules |
