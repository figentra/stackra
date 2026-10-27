---
"@stackra/ui": minor
---

`useCatalogueText` moved out of the `.` entry into the shared React layer: import it from `@stackra/ui/react` or
`@stackra/ui/native` (ADR 0004 §1, STA-926). Core no longer imports `@stackra/i18n/react`, and the oxlint disable is
gone.
