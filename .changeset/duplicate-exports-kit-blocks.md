---
"@stackra/cli": patch
---

`stackra duplicate-exports` allows five names that today's kit blocks share with older exports, each with its reason:

- `CalendarSystem`: ui derives its picker list from i18n's enum.
- `LocaleSwitcher` and `LocaleSwitcherProps`: ui's drawn switcher, and i18n's headless kit block that binds it.
- `PushPermission` and `PushRegistration`: notifications' registration port and its answer, and platform's push address and permission hook.

Main's `validate --repository` reported them.
