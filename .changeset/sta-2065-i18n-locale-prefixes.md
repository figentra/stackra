---
"@stackra/gen": minor
---

The generated `#stackra/i18n` module exports `prefixes`, the URL prefix of each locale the member's I18nConfig
override configures: `""` for the default locale under `prefix_except_default`, and otherwise `/` plus the lowercase
tag (`{ "en": "", "ar-SA": "/ar-sa" }`, ADR 0297 decision 4). A field the override does not set takes the base
default, so a member with no override gets `{ "en": "" }`. `I18n`, `locales`, `catalogues` and `loadMessages` are
unchanged. The Expo config reads the I18nConfig override through the same lookup.
