---
"@stackra/feature-flags": minor
---

Add `@stackra/feature-flags`, the feature flags of the programming model v3.1. It ships the `Flag({ default, expires,
removalIssue, scopes })` kind, which checks the expiry and the scopes when a class is declared and defaults the scopes
to platform and tenant, and `flagRefs`, which builds the typed `Flags.<module>.<name>` references of `#stackra/flags`
from declared classes or from written-out consumed flags. The `FlagProvider` port (`./contracts`) comes with two
drivers: `ConfigFlagProviderDriver`, which answers from build-time and runway values, and `PosthogFlagProviderDriver`,
which calls PostHog's flags endpoint and never sends an anonymous subject. `FlagReader` loads the subject that the
targeting names, keeps the last values when a load fails, applies only the newest load and refreshes on
`refreshEvery`. The package also adds the `FeatureFlagsConfig` configuration (`feature_flags`) with its shipped schema
`FeatureFlagsConfig$`, `FlagTargeting`, `useFlag` (`./react`) and `fakeFlags` (`./testing`).
