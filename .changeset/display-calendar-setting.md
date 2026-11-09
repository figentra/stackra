---
"@stackra/i18n": minor
"@stackra/settings": minor
---

Dates follow the tenant's calendar. `@stackra/i18n` adds `CalendarSystem` (`gregory`, `islamic-umalqura`, Intl's
names). `formatDateTime` and `dateTimeFormatIn` take a `calendar` (Gregorian by default; an explicit
`options.calendar` wins), and `I18nProvider` takes a `calendar` prop that `useDateTime` writes in. `@stackra/settings`
adds `DisplaySettings` (key `display`, platform, product and tenant scopes, sent to clients) with `calendar`,
Gregorian by default: the server reads it and passes it to `formatDateTime`, and an app passes it to `I18nProvider`.
