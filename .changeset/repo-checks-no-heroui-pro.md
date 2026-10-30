---
"@stackra/repo-checks": minor
---

<!-- Purpose: release note for the HeroUI Pro removal: no member may depend on HeroUI Pro. Boundary: changelog text only. Runtime: none. Governing contract: ADR 0469. -->

`checkMember` refuses HeroUI Pro (`PRO_DEPENDENCIES`: `@heroui-pro/react`, `heroui-native-pro`) in every member, apps
included: Stackra ships free HeroUI and its own components only (ADR 0469).
