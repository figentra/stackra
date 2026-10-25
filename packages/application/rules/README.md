# @stackra/rules

Stackra rules: one condition engine for every rule consumer (ADR 0331). Segments, discounts, pricing rules, related
products, automations and visibility rules test facts with the same tree, the same operators and the same reading of a
missing value, so one rule never gives two answers in two places. A rule is stored data that names registered fields
and operators; it is never an expression and never runs code (ADR 0154, ADR 0227).

**Tier:** `tier:lib` (`packages/application/rules`). Entries `./contracts`, `.`, `./node` and `./react`. Depends on
`@stackra/content`, `@stackra/contracts`, `@stackra/database`, `@stackra/errors`, `@stackra/events`, `@stackra/i18n`,
`@stackra/model`, `@stackra/money`, `@stackra/ui` and `@stackra/validation`.

## What is here

| Entry         | Symbol                                                                 | Use                                                                    |
| ------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `./contracts` | `FieldType`, `Operator`                                                | the field types and the operator set each one fixes (IAM may reuse it) |
| `./contracts` | `FactSource`, `FactField`, `GeoPoint`                                  | what a consumer registers, and a geo fact (types)                      |
| `.`           | `Rules`                                                                | one consumer's registry of fact sources and the check of a condition   |
| `.`           | `evaluate`                                                             | the evaluator: deterministic, explained by tree path                   |
| `.`           | `Condition`, `Facts`, `FactValue`, `Evaluation`, `EvaluationStep`, ... | the tree, the facts and the result (types)                             |
| `.`           | `ConditionInvalidError`, `RuleSetChangedError`                         | refusals (400, 409)                                                    |
| `.`           | `RuleSetPublished`                                                     | the domain event of a published revision                               |
| `./node`      | `RuleSet`, `RuleSetService`, `RuleSetRevision`                         | versioned rule sets on `HasRevisions`, and their service               |
| `./react`     | `RuleBuilder`, `RuleBuilderProps`                                      | the rule-builder panel on `@stackra/ui`                                |

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

## Rule builder

```tsx
<RuleBuilder rules={DISCOUNT_RULES} value={condition} onChange={setCondition} />
```

The panel edits `all` and `any` groups, negation and leaves, offering only the registered fields and the operators of
each field's type, and shows each node's problem where it is. Its words are this package's `rules` catalogue
(`assets/lang/{en,ar}/rules.json`); field labels are the fact source's keys. Saving and the server-side check are the
host's. Start a new rule with `{ all: [] }` (an empty `all` holds; an empty `any` does not).

## Not here

- The outcome of a match: segments record membership, promotions apply a discount, pricing chooses a price (ADR 0331
  decision 9).
- A boolean field type: ADR 0331 fixes seven types; a yes-or-no fact is an enum of two codes until an ADR adds one.
- The planned gen check (an unregistered field or a foreign operator in a seeded rule set) and the oxlint rule against
  other evaluators.
- A native rule builder.
