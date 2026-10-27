# @stackra/rules

<!--
Stackra file contract:
Purpose: the package's reader guide: the condition engine, fact sources and their registration hook, outcomes and
         the floor guard (list floors included), rule sets, rule-set packs and their scope-less defaults, the matrix
         readers and the rule builder.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0331; ADR 0370; ADR 0425; ADR 0455; ADR 0462 (decision 1: `FactProvider`); config-model
                    sections 4 to 6.
-->

Stackra rules: one condition engine for every rule consumer (ADR 0331). Segments, discounts, pricing rules, related
products, automations and visibility rules test facts with the same tree, the same operators and the same reading of a
missing value, so one rule never gives two answers in two places. A rule is stored data that names registered fields
and operators; it is never an expression and never runs code (ADR 0154, ADR 0227).

**Tier:** `tier:lib` (`packages/application/rules`). Entries `./contracts`, `.`, `./node` and `./react`. Depends on
`@stackra/actions` and `@stackra/ai` (types of the matrix rows only), `@stackra/content`, `@stackra/contracts`, `@stackra/database`, `@stackra/errors`, `@stackra/events`, `@stackra/i18n`,
`@stackra/market-packs`, `@stackra/model`, `@stackra/money`, `@stackra/support` (`isRecord`), `@stackra/ui` and
`@stackra/validation`.

## What is here

| Entry         | Symbol                                                                 | Use                                                                      |
| ------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `./contracts` | `FieldType`, `Operator`                                                | the field types and the operator set each one fixes (IAM may reuse it)   |
| `./contracts` | `FactSource`, `FactField`, `GeoPoint`                                  | what a consumer registers, and a geo fact (types)                        |
| `./contracts` | `OutcomeKind`, `OutcomeParam`, `SeedResult`                            | the outcomes a consumer registers; what a seed did                       |
| `./contracts` | `FIELD_KEY`                                                            | the one key casing (camelCase) every registry tests keys with            |
| `.`           | `Rules`                                                                | one consumer's registry of fact sources and the check of a condition     |
| `.`           | `evaluate`                                                             | the evaluator: deterministic, explained by tree path                     |
| `.`           | `Condition`, `Facts`, `FactValue`, `Evaluation`, `EvaluationStep`, ... | the tree, the facts and the result (types)                               |
| `.`           | `decide`, `Decision`, `DecideOptions`, `guardFloors`, `FlooredParam`   | a rule's guarded outcomes; the market-pack floor as the final guard      |
| `.`           | `OutcomeDispatcher`, `OutcomeHandler`, `Outcome`, `RuleDocument`       | the consumer's handlers per outcome kind                                 |
| `.`           | `RuleSetPack$`, `RuleSetPack`, `RuleSetTemplate`                       | default rule sets as a versioned seed document                           |
| `.`           | `RuleOutcome`, `RuleOutcomeClass`                                      | a declared outcome kind gen lists in the manifest's `outcomes`           |
| `.`           | `Condition$`, `FactSource$`, `rules.conditionSchema()`                 | untrusted condition trees: shape only, or against a field registry       |
| `.`           | `FloorValue`, `rules.floorProblems`, `checkOutcomes(input, floors)`    | money floors with their currency; refusing a value past a floor at save  |
| `.`           | `ConditionInvalidError`, `OutcomeInvalidError`, `RuleSetChangedError`  | refusals (400, 400, 409)                                                 |
| `.`           | `RuleSetPublished`                                                     | the domain event of a published revision                                 |
| `.`           | `ACTION_PERMISSION_RULES`, `actionPermissionRowsOf`                    | the AI action permission matrix as a rule set, and its reader            |
| `.`           | `packApprovalFloorOf`, `APPROVAL_FLOOR_KEY`                            | a market pack's AI approval floor (`ai.approval_floor`) for the resolver |
| `.`           | `packRuleSetOf`, `rules.register`                                      | a pack's default rule set with no scope; an edition's fact sources       |
| `.`           | `FactProvider`, `factsFrom`, `FactSubject`                             | an add-on's facts about a subject (segment membership), keyed by source  |
| `./node`      | `RuleSet`, `RuleSetService`, `RuleSetRevision`                         | versioned rule sets on `HasRevisions`, and their service                 |
| `./node`      | `ConditionField`, `ConditionFieldService`                              | the cross-service condition-field registry (`rules.condition_fields`)    |
| `./react`     | `RuleBuilder`, `RuleBuilderProps`                                      | the rule-builder panel on `@stackra/ui`                                  |

`.` and `./contracts` are isomorphic: a browser previews an evaluation with the server's code.

## Register facts

A consumer describes the fields its rules may test, and gets the operators of each field's type. It computes the facts
itself; the engine knows no commerce.

```ts
export const CART_FACTS = {
  key: "cart",
  fields: {
    total: { type: FieldType.Money, label: I18n.promotions.facts.cartTotal },
    skus: { type: FieldType.List, label: I18n.promotions.facts.skus },
  },
} satisfies FactSource;

export const DISCOUNT_RULES = Rules.create({
  key: "promotions.discount",
  sources: [CART_FACTS, CUSTOMER_FACTS],
});
```

| Field type | Fact value | Operators                                                                                 |
| ---------- | ---------- | ----------------------------------------------------------------------------------------- |
| `string`   | `string`   | equals, not equals, one of, not one of, contains, starts with, ends with                  |
| `number`   | `number`   | equals, not equals, less than, at most, greater than, at least, between                   |
| `money`    | `Money`    | as number; an amount in another currency never matches (`currency_mismatch`)              |
| `date`     | `Date`     | before, after, between, within the last, not within the last (`30d`, `12h`, `PT15M`)      |
| `enum`     | a code     | equals, not equals, one of, not one of; the field lists its codes and their labels        |
| `list`     | `string[]` | includes, includes any, includes all, includes none, is empty, is not empty               |
| `geo`      | `GeoPoint` | within radius, outside radius (`{ latitude, longitude, radiusKilometres }`, great circle) |

An edition (or any later module) adds its own fact sources after `create` with the registration hook, at module
init, before it saves or evaluates a rule that names them. Until then a condition naming them is refused at save time
(`field_unknown`), as any unknown field is.

```ts
DELIVERY_RULES.register(EXPRESS_EDITION_FACTS); // throws TypeError for a repeated or misdeclared source
```

An add-on that knows facts the consumer does not (segment membership) binds a driver to the `FactProvider` port: its
`source` is registered as above, and `factsFrom(providers, subject)` returns each provider's facts under its source key
for the consumer to pass to `evaluate`. This is how a business rule targets a segment ("VIP customers cannot cancel":
`{ field: "segments.ids", operator: "includes", value: "seg_…" }`) without the engine or IAM knowing segments
(ADR 0462 decision 1). Two providers of one source key throw.

```ts
const facts = {
  order: { total },
  ...(await factsFrom(providers, { model: "commerce.customer", id })),
};
evaluate(CANCEL_RULES, condition, facts, { now });
```

Keys have one casing: a source, field, outcome kind and parameter key is camelCase (`FIELD_KEY`, `channelId`, never
`channel_id`), so the field a model names in TypeScript is the field a stored condition names in every service.
`Rules.create` throws on any other casing, and a condition naming `record.channel_id` is `field_unknown`.

Every type also has `is_set` and `is_not_set`. A missing fact (`null` or left out) matches `is_not_set` and nothing
else. Strings compare exactly, ranges include both ends, and `within_last` holds from the current time minus the
duration onwards.

## Check and evaluate

```ts
const condition = DISCOUNT_RULES.check(input.condition); // ConditionInvalidError, field errors by node path
const result = evaluate(DISCOUNT_RULES, condition, facts, { now: ctx.startedAt, revision: 3 });
result.matched; // what a match does is the consumer's
result.steps; // [{ path: "", matched }, { path: "all.0", matched, field, operator, reason? }, ...]
```

- A tree has at most 200 nodes and 8 levels. A leaf names a registered field, an operator of its type and a value that
  operator takes; the refusal names each bad node (`field_unknown`, `operator_not_allowed`, `value_invalid`,
  `node_invalid`, `too_deep`, `too_many_nodes`) and never echoes a value.
- The engine reads no clock: `now` is the caller's, so the same condition, facts, time and revision always give the same
  result. `evaluate` checks the condition again first, so a stored rule naming a field the consumer dropped is refused.
- Every node is explained by its path (`all.1.not`), root first; a step never carries a fact's value.

## Rule sets

```ts
const ruleSet = await ruleSets.open(scope, DISCOUNT_RULES);
const revision = await ruleSets.draft(ruleSet.id, DISCOUNT_RULES, input.condition); // 1, 2, 3, ...
await ruleSets.publish(ruleSet.id, revision); // records RuleSetPublished
await ruleSets.evaluate(ruleSet.id, DISCOUNT_RULES, facts, { now }); // the revision published last
```

`rules.rule_sets` holds `id` (`rset_…`), the scope (`scope_id`, `scope_path`) and `consumer`, under forced row-level
security matching `scope_path` at or below the session's `app.scope_paths`. Conditions are revisions of the
`HasRevisions` trait in `content.revisions` (`@stackra/content`): a revision is frozen once written, a draft until
published, and publishing an older revision rolls back to it. A draft for another consumer's rule set is `not_found`; two
drafts racing for one number refuse `rule_set_changed` (retryable).

## Outcomes and the floor guard

A consumer registers the outcomes its rules may yield beside its facts, and one handler per kind. A parameter may name
a market-pack floor key; the value of the floor is pack data, never code.

```ts
export const RETURNS_RULES = Rules.create({
  key: "orders.returns",
  sources: [ORDER_FACTS],
  outcomes: [
    {
      key: "refundWindow",
      label: I18n.orders.outcomes.refundWindow,
      params: {
        days: {
          type: FieldType.Number,
          label: I18n.orders.outcomes.days,
          floor: "consumer.withdrawal_days",
        },
      },
    },
  ],
});
export const RETURNS_OUTCOMES = OutcomeDispatcher.create(RETURNS_RULES, {
  refundWindow: (params, order: Order) => order.setRefundDays(params["days"] as number),
});

const decision = await ruleSets.decide(ruleSetId, RETURNS_RULES, facts, {
  now,
  floors: floorsOn(resolved, today),
});
decision.floored; // [{ kind: "refundWindow", param: "days", from: 7, to: 14, law, market, version }]
await RETURNS_OUTCOMES.dispatch(decision, order);
```

- `decide` evaluates the rule and, when it matches, checks its outcomes and runs `guardFloors`: a number or money
  parameter below a `min` floor or above a `max` floor is moved to it and reported with the law that set it. `floors`
  is required, so no outcome leaves without the guard; a market with no floors passes `[]`.
- A money floor's pack value is `{ minor, currency }`. A money amount in another currency counts as crossing it (the
  engine never converts) and is moved to the floor's own amount.
- A `list` parameter may name a `list` floor (refused goods): a list missing an item of the floor is moved to the list
  plus the missing items.
- A floor whose pack value or bound does not fit its parameter (not a number, not money, not a list of strings; a
  `list` floor on a number or a `min` on a list) throws rather than let an outcome through unguarded.
- At save time the rules studio refuses instead of moving: `RuleSetService.draft(id, rules, condition, outcomes,
floors)` throws `outcome_invalid` with `past_floor` or `currency_mismatch` at `<index>.params.<name>`, and
  `RuleBuilder` with `floors` marks the same before the save.

Outcome kinds may be declared as classes, one per `<name>.outcome.ts` in the module's `rules/` group, so gen lists them
in the manifest without running the consumer:

```ts
export class RefundWindow extends RuleOutcome({
  key: "refundWindow",
  label: "returns::outcomes.refund_window",
  params: {
    days: {
      type: FieldType.Number,
      label: "returns::outcomes.days",
      floor: "consumer.withdrawal_days",
    },
  },
}) {}

export const RETURNS_RULES = Rules.create({
  key: "returns.policy",
  sources: [ORDER_FACTS],
  outcomes: [RefundWindow],
});
```

## Untrusted conditions

A service that stores a tree it does not evaluate checks its shape with `Condition$` (200 nodes, 8 levels, known
operators, `<source>.<field>` paths). A service that checks fields at write time builds a registry, from its own
sources or from another service's published `FactSource$` documents, and validates with `rules.conditionSchema()`:
each unknown field, foreign operator or unfitting value is a zod issue at its node's path with the snake_case code.

### The cross-service registry

The service that owns a model publishes the fields other services' conditions may test on it; the service that stores
those conditions (Access, for a deny on `orders.order`) checks a tenant's tree against them at write time.

```ts
await conditionFields.sync("orders.order", [RECORD_FACTS]); // FactSource$ documents; replaces the model's rows
const condition = await conditionFields.check("orders.order", input.condition); // ConditionInvalidError
await conditionFields.check(null, input.condition); // a wildcard permission: the shape only (Condition$)
const rules = await conditionFields.rulesOf("orders.order"); // the model's Rules, to evaluate with; null without rows
```

`rules.condition_fields` (migration `rules.0003`) is a platform table: one row per model, source and field, no scope
and no row-level security. A sync is all or nothing for its model; a model with no row refuses every condition
(`model_unregistered`). Who may call `sync` is the host action's permission.

- The dispatcher needs exactly one handler per registered kind, and takes only a `Decision`.

## The AI action permission matrix

The matrix (`rule-set:os:ai-action-permissions`, ADR 0398) is an ordinary rule set of the consumer
`ai.action_permissions` (`ACTION_PERMISSION_RULES`): its condition is `{ all: [] }` and each outcome of kind `row` is a
matrix row: `action` and `state` (`off`, `suggest`, `after_approval`, `on_its_own`), and the optional `role`,
`recordKind`, `recordId`, `dataClass`, `seatKind`, `notRequester` and `stepUp` (`yes` or `no`). It holds up to 500 rows,
is seeded per product from a `RuleSetPack$` and is edited in the rules studio.

```ts
const rules: ApprovalRules = {
  floor,
  packFloor: packApprovalFloorOf(resolved), // the pack value at ai.approval_floor, or undefined
  matrix: await ruleSets.approvalMatrix(scope), // the published rows, [] without a matrix
  policy,
  preferences,
};
resolveApproval(request, rules);
```

A row names an approver rule when it names a seat kind, `notRequester` or `stepUp`; left out, `notRequester` is `yes`
and `stepUp` is `no`. A record id needs its record kind. A pack floor value of the wrong shape throws.

An outcome parameter may be `optional` (never one with a floor), and a consumer may raise its outcome limit with
`maxOutcomes` (1 to 500, 20 by default).

## Rule-set packs

A product's seed pack ships its default rule sets as a versioned document (`RuleSetPack$`):
`{ key, version: "1.2.0", ruleSets: [{ key, consumer, condition, outcomes }] }`.

```ts
await ruleSets.seedPack(scope, pack, [RETURNS_RULES, COD_RULES]); // { "commerce.returns": "created", ... }
```

`seed` creates and publishes a template the first time (`rules.rule_sets.seed_key` and `seed_version`, migration
`rules.0002`), skips a version it already holds, and later publishes a new version only while the latest revision is
a seed's: a tenant's edit stands (`kept`). Seeded revisions carry `seed: { key, version }` in their data.

A pack's default rule set also opens with no `ScopeRef` and nothing stored, for a consumer that decides before a scope
has its own (ADR 0455):

```ts
const rule = ruleSets.openDefault(pack, "commerce.returns.window", RETURNS_RULES); // number 0, never published
const decision = decide(RETURNS_RULES, rule, facts, { now: ctx.startedAt, floors });
// isomorphic: packRuleSetOf(pack, "commerce.returns.window", RETURNS_RULES)
```

## Rule builder

```tsx
<RuleBuilder rules={DISCOUNT_RULES} value={condition} onChange={setCondition} />
<RuleBuilder rules={RETURNS_RULES} value={condition} onChange={setCondition}
  outcomes={outcomes} onOutcomesChange={setOutcomes} floors={floors} />
```

The panel edits `all` and `any` groups, negation and leaves, offering only the registered fields and the operators of
each field's type, and shows each node's problem where it is. Its words are this package's `rules` catalogue
(`assets/lang/{en,ar}/rules.json`); field labels are the fact source's keys. Saving and the server-side check are the
host's. Start a new rule with `{ all: [] }` (an empty `all` holds; an empty `any` does not). Given `onOutcomesChange`,
the panel also edits the outcomes: a registered kind per outcome and a field per parameter in its type.

## Not here

- Applying an outcome: the consumer's handlers do (segments record membership, promotions apply a discount, pricing
  chooses a price; ADR 0331 decision 9). The engine checks, guards and routes outcomes only.
- A boolean field type: ADR 0331 fixes seven types; a yes-or-no fact is an enum of two codes until an ADR adds one.
- The pack-schema entry of `ai.approval_floor` (`@stackra/market-packs`) and the seeded matrix rows (product packs).
- The planned gen check (an unregistered field or a foreign operator in a seeded rule set) and the oxlint rule against
  other evaluators.
- A native rule builder.
