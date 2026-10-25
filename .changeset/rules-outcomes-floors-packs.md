---
"@stackra/rules": minor
---

Add outcome kinds to `@stackra/rules`: consumers register `OutcomeKind`s beside their fact sources, `Rules.checkOutcomes`
checks stored outcomes, `decide` evaluates a rule and guards every outcome against the market-pack floors
(`guardFloors`, `Decision.floored`), and `OutcomeDispatcher` routes outcomes to the consumer's handlers. Rule sets now
store outcomes with their condition (`RuleSetService.draft`, `decide`), and default rule sets ship as versioned
`RuleSetPack$` documents seeded with `RuleSetService.seed` and `seedPack` (migration `rules.0002`), never overwriting a
tenant's edit.
