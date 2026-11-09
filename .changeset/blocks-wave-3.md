---
"@stackra/scope": minor
"@stackra/entitlements": minor
"@stackra/i18n": minor
---

Three kit blocks (ADR 0504). `@stackra/scope/react` adds `ScopePicker`: the host's scopes as a tree nested by path,
or a search field above `searchThreshold` scopes (8 by default); choosing one sets the active scope that `useScope`
reads. `@stackra/entitlements` gains a `./react` entry with `EntitlementGate`, which shows its children only while the
plan grants an entitlement (asked through the container's `EntitlementSource`), its `fallback` otherwise, and nothing
while the answer is pending. `@stackra/i18n/react` adds a headless `LocaleSwitcher` that binds @stackra/ui's
`LocaleSwitcher` props to the nearest `I18nProvider`, remembers the choice and switches through `setLocale` or the
host's `onChange`. Every word comes from the host.
