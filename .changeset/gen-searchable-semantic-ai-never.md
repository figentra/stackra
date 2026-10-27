---
"@stackra/gen": minor
---

Add the `searchable_semantic_ai_never` refusal (`checkSemanticSearch`, full pass only): a `@Searchable({ semantic: true })`
text field whose `@Classify` data class says `ai: never` is refused. The source reader now carries a data class's
constant effects on its `@Classify` facet as `options.dataClass` (STA-1251).
