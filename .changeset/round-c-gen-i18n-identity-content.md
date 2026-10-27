---
"@stackra/gen": minor
"@stackra/i18n": minor
"@stackra/rules": minor
"@stackra/notifications": minor
"@stackra/ui": minor
"@stackra/navigation": minor
"@stackra/panel": minor
"@stackra/consent": minor
"@stackra/scope": minor
"@stackra/tenancy": minor
"@stackra/settings": minor
"@stackra/theming": minor
"@stackra/workflow": minor
"@stackra/identity": minor
"@stackra/filesystem": minor
"@stackra/content": minor
"@stackra/actions": minor
"@stackra/licensing": minor
---

Round C. gen: lazy catalogue loaders and `loadMessages(locale)` in the generated I18n (only runtime dependencies bring
lang); event wire names stay `<module>.<name>.v<n>` and a prefixed name is refused (`event_name_prefixed`); a service
subscribes its own topics into its inbox for local listeners; the coverage-audit refusals (`checkConventions` and
friends). i18n: `loadMessages` with the ar-SA, ar, en fallback chain. Packages that ship `assets/lang` export
`./assets/*`. tenancy: `belongsToTenant({ nullable: true })` compiles through `equalsOrUnset`. workflow: `ServiceAcked`
carries `KeptRecords` (migration 0008). identity: app-approval sign-in and step-up with number matching and QR.
filesystem: `readStream` on every disk. content: custom fields per runtime subtype (migration 0004); `ContentModule`
exports `RevisionService`. actions: `RateLimitBudget` port sizes the area bucket. licensing: `LicenceIssuer` port with
Keygen and memory drivers, install key signer and signed usage reports.
