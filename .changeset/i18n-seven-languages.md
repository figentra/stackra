---
"@stackra/i18n": minor
---

Ship the seven languages (STA-788, ADR 0403): `Locale` gains `es`, `es-US`, `it` and `nl`, and every case carries its
default week start and clock. Add `HourCycle`, `LocaleFormat`, `localeFormat` and `I18nConfig.formats` (a per-locale
override), build every Intl tag with the `hc` keyword, put the active format in the provider's state, and add
`DisplayUnit` and `formatQuantity` for imperial display over metric storage.
