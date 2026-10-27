# AGENTS — @stackra/rules

<!--
Stackra file contract:
Purpose: the agent rules of @stackra/rules: where code goes, entries and barrels, the package rules (one evaluator,
         floors, fact-source registration, pack defaults) and PII.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0294; ADR 0305; ADR 0331; ADR 0455.
-->

One condition engine for every rule consumer: the condition tree, the operator sets, fact sources, the check, the
evaluator, versioned rule sets and the rule builder (ADR 0331). Member at `packages/application/rules` (`tier:lib`), in
the programming model v3.1 shape (ADR 0294, 0305). Entries `./contracts`, `.`, `./node`, `./react`.

## Where code goes

| You are writing…                             | It goes in…                                               |
| -------------------------------------------- | --------------------------------------------------------- |
| A field type, an operator                    | `src/contracts/enums/`                                    |
| A type a consumer registers                  | `src/contracts/types/`                                    |
| An outcome, a decision, a pack type          | `src/core/types/`                                         |
| The floor guard, `decide`, the dispatcher    | `src/core/{functions,values}/`                            |
| A condition, fact or evaluation type         | `src/core/types/`                                         |
| The registry, the evaluator, an operand rule | `src/core/{values,functions}/`                            |
| A refusal, the event and its shipped schema  | `src/core/{errors,events,constants}/`                     |
| The model, its service                       | `src/node/{models,services}/`                             |
| The condition-field registry                 | `src/node/{models,services}/condition-field.*`            |
| A reader of a rule set another package reads | `src/core/{constants,functions}/` (the matrix readers)    |
| A migration                                  | `src/node/database/migrations/<NNNN>-<name>.migration.ts` |
| The rule builder and its parts               | `src/react/rule-builder/`                                 |
| A word the builder or the matrix shows       | `assets/lang/<locale>/rules.json` (seven locales)         |
| A test                                       | `__tests__/<name>.<kind>.test.ts(x)` beside it            |

## Entries and barrels

- `src/{contracts,core,node,react}/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add
  every new public file to its barrel and to that entry's `index.test.ts`.
- `src/contracts/` is the leaf; `core` imports `contracts`; `node` and `react` import `core` through `#core/index`.
- `.` stays isomorphic: nothing under `src/core/` imports an ORM or a Node API, so the builder previews evaluations.

## This package

- One evaluator (ADR 0331 decision 1): never write a second walk of a condition tree here or in a consumer.
- Data only (decision 10): no `eval`, `Function`, template or regex from user input; a new operator is a case of
  `Operator`, a place in `FieldType`'s sets, an operand rule in `fitsOperand` and a branch of `evaluate`, never data.
- Deterministic (decision 6): the evaluator reads no clock, store or environment; the time is `EvaluateOptions.now`.
- A missing fact matches `is_not_set` and nothing else; keep that one reading everywhere.
- The engine returns results only; it never applies an outcome (decision 9). `decide` checks and guards outcomes,
  `OutcomeDispatcher` routes them to the consumer's handlers.
- Every outcome passes `guardFloors` (config-model section 4): `DecideOptions.floors` stays required. No floor value,
  country or rate is written here; floors come from `@stackra/market-packs`.
- `crossedFloor` is the one floor comparison: `guardFloors` moves what it reports at decision time and `floorProblems`
  refuses it at save time, so the two never disagree. A money amount in another currency always crosses (ADR 0425).
- `conditionProblems` is the one walk of an untrusted tree: `Rules.problems`, `conditionSchema()` and `Condition$` all
  call it, so shape checks never drift.
- A seed never overwrites a rule set whose latest revision is the tenant's. A pack's default opens without a scope
  through `packRuleSetOf` (isomorphic) and `RuleSetService.openDefault` (ADR 0455); never add a platform scope row
  to stand in for it.
- `Rules` is frozen except for its fact sources: `register` adds an edition's sources after `create` (ADR 0455), never
  replaces or removes one, and checks them as `create` does. A condition naming an unregistered source stays
  `field_unknown`. `ConditionFieldService.sync` reads `rules.fields()`, so sync after the edition registers.
- `crossedFloor` handles every `FloorBound` (`min`, `max`, `list`); a list floor sits on a `list` parameter only.
- No tenant vocabulary (R-59, ADR 0323): rule sets are keyed by the contracts `ScopeRef`.
- Field error codes are snake_case and never echo a value; explanation steps never carry a fact's value.
- One key casing (STA-1250): every source, field, outcome kind and parameter key is tested with `FIELD_KEY`
  (camelCase); never add a second pattern or accept snake_case keys.
- `rules.condition_fields` is platform data: no scope column, no RLS; only `ConditionFieldService.sync` writes it.
- The AI matrix's state codes come from `@stackra/ai`'s `ActionPermission` by type only (`satisfies`); `@stackra/ai`
  and `@stackra/actions` are type-only imports here, so `.` stays light and isomorphic. No row, floor or default value
  is written in this package.
- Migrations are frozen literal snapshots that import only @stackra/database.
- No parameter properties and no `#private` fields: services typecheck this source under `erasableSyntaxOnly`.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII

| Data        | Where                                  | Handling                                                                          |
| ----------- | -------------------------------------- | --------------------------------------------------------------------------------- |
| Facts       | `Facts` passed to `evaluate`           | Possibly personal (an email, a location); read in memory, never stored or logged. |
| Conditions  | `content.revisions.data` of a rule set | Scope configuration; may name a value such as an email domain; never logged.      |
| Explanation | `Evaluation.steps`                     | Paths, fields and operators only; no fact value.                                  |
| Outcomes    | `content.revisions.data` of a rule set | Scope configuration (days, amounts, codes); never logged.                         |
