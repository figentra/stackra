---
"@stackra/i18n": minor
---

Add `@stackra/i18n`: the `Locale` enum (`en`, `en-US`, `ar`, `ar-SA`, each with its endonym), `NumberingSystem`
(Latin by default, Arabic-Indic, or the user's own) and `LocaleUrlStrategy`; `I18nConfig`, the configuration a member
overrides with its locales, right-to-left set, fallback chains, digits and URL strategy, validated by its shipped
`I18nConfig$`; the ICU engine `formatMessage` over namespaced catalogues, `mergeCatalogues` for regional overlays
merged along the fallback chain, and `keys`, which builds the typed `I18nKey` tree gen writes into `#stackra/i18n`.
`./react` adds `I18nProvider` and the hooks `useTranslation`, `useLocale`, `useLocaleChoice` (the visitor's remembered
choice, never read to redirect), `useMoney`, `useNumber` and `useDateTime`, all in the active locale and digits.
