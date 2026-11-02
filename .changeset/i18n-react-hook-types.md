---
"@stackra/i18n": patch
---

`@stackra/i18n/react` exports the named return types of its hooks: `Translation`, `MoneyFormatter`, `LocaleState` and
`LocaleChoice`. A consumer's exported class that keeps a hook's result in a field (`readonly i18n = useTranslation()`)
now emits declarations; before, `tsc --declaration` refused it with TS4029, since the type could not be named.
