---
"@stackra/gen": minor
---

Gen agrees with the `base-matches-suffix` lint (STA-1365). No `kind_unregistered_base` for a class extending `Error`
(any `…Error`) in an `.error.ts` file, a base-less class in a `src/testing/` `.service.ts` harness, or a class under
`// oxlint-disable-next-line stackra/base-matches-suffix -- reason: …` (`Container`, `ActionPipeline`). A driver of
`@stackra/contracts` that extends its port is no `kind_suffix_mismatch` and has no constructor tokens. An abstract class
is never `event_base_abstract` and its constructor is never read (no `token_not_a_class` for a protected base
constructor); a class without a constructor now takes the nearest one its chain declares. `I18nKey` reads as the
`i18n_key` string brand (a string column, `z.string()` cast to the brand). A member that declares packages without
`@stackra/container` (`@stackra/testing`) gets no wiring, no member module and a container-free test setup, so no
`generated_dependency_missing`.
