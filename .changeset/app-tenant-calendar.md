---
"@stackra/app": minor
---

Every app shows dates in the tenant's calendar with no wiring of its own: `Contexts`' `i18n` context reads the
tenant's `DisplaySettings.calendar` (`@stackra/settings`) through the container's `SettingsReader` and passes it to
`I18nProvider`, so `useDateTime` writes Hijri dates for a tenant on the Umm al-Qura calendar. Gregorian until the read
answers, and where no reader is bound.
