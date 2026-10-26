---
"@stackra/rules": minor
---

Declare outcome kinds as classes (`RuleOutcome({ key, label, params })`) that `Rules.create` takes beside the data form
and gen lists in the manifest. Floors guard money parameters too: a money floor's pack value is `{ minor, currency }`,
and an amount in another currency is moved to the floor. `floorProblems` and `checkOutcomes(input, floors)` refuse an
outcome past a floor at save time (`past_floor`, `currency_mismatch`), `RuleSetService.draft` takes the market's
floors, and `RuleBuilder` edits outcomes and marks floors before the save. Ship `Condition$` and `FactSource$` and add
`rules.conditionSchema()` for untrusted condition trees checked against a field registry (STA-773, STA-817, ADR 0425).
