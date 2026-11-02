---
"@stackra/tenancy": minor
"@stackra/showcase": patch
---

`TenantMenu`, the tenancy kit's membership switcher (ADR 0504), in `@stackra/tenancy/react` (a menu behind a
button) and in the new `@stackra/tenancy/native` entry (a list for the app's own sheet). It reads the container's
`TenantSwitcher` through `useTenant` and `useTenantSwitcher`, takes every word from the host in `labels`, and reports
`onSwitched` (and `onError` on native). The showcase lists it under Blocks.
