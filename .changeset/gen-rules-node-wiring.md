---
"@stackra/gen": minor
---

Wire the `@stackra/rules` node into a service that injects `RuleSetService`: the wiring binds it over
`repositoryOf(Revision)` and the registrations write its `RuleSet` model partner (`PLATFORM_PARTNERS`). A
`PLATFORM_BINDINGS` token may now be a per-model token.
