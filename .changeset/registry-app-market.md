---
"@stackra/registry": minor
---

Add the app market records of ADR 0355 decision 8: `AppReview` with `ReviewState` and `canTransitionReview`,
`DeveloperSandbox`, `FeeSchedule` and `PartnerPayout` with `computePartnerPayout` (basis points rounded half up plus a
fixed fee, never above the gross); and the edition install of ADR 0335: `EditionBundle` and `planEditionInstall`
(dependency order, bundled base modules only, inert contributions to enhanced modules).
