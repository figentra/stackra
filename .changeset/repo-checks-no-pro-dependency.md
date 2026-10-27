---
"@stackra/repo-checks": minor
---

<!-- Purpose: release note for stackra-189: the Pro dependency rule after @stackra-pro/ui left figentra/stackra. Boundary: changelog text only. Runtime: none. Governing contract: ADR 0461 (decision 3), ADR 0310. -->

No member of figentra/stackra may depend on an `@stackra-pro/*` package, apps included (`PRO_SCOPE`, ADR 0461):
`@stackra-pro/ui` moved to figentra/stackra-pro. HeroUI Pro (`PRO_DEPENDENCIES`: `@heroui-pro/react`,
`heroui-native-pro`) stays apps-only. The Pro wrapper's Keygen publishing check and the `PRO_WRAPPER` export are
removed, `expectedName` no longer maps `packages/design-system/ui-pro` to `@stackra-pro/ui`, and
`SEVEN_LANGUAGE_MEMBERS` drops `packages/design-system/ui-pro`.
