---
"@stackra/rules": minor
---

A pack's default rule set opens with no `ScopeRef`: `packRuleSetOf(pack, key, rules)` (isomorphic) and
`RuleSetService.openDefault(pack, key, rules)` return it checked against the consumer's `Rules`, ready for `decide`.
`Rules.register(...sources)` adds an edition's fact sources after `Rules.create`; a condition naming an unregistered
source is still refused at save time. A `list` outcome parameter may name a `list` floor: `crossedFloor` and
`guardFloors` move a list missing floor items to the list plus those items. `Rules.sources` is now a getter (ADR 0455,
STA-917).
