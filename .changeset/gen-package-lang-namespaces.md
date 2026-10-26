---
"@stackra/gen": minor
---

The i18n target merges the `assets/lang` of every declared `@stackra/*` package into the member's `I18n`, keyed by the
package namespace, scans `I18n.<namespace>.<path>` references (tests included) and refuses `i18n_key_missing` and
`i18n_namespace_clash`. A shared `dependencyPath` resolves packages under `node_modules`.
