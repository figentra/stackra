---
"@stackra/infra-mobile": minor
---

Add `@stackra/infra-mobile` (ADR 0171): `mobileInfraPlan` reads the mobile release plan from the root and mobile
runways (the EAS account and project, the Apple team and App Store record, the Play account and app-signing
fingerprint, EAS-managed signing, and one profile, channel and EAS environment per environment that ships through EAS)
and lists the owner steps no API takes (`MobileOwnerStep`); `./node` adds `mobileStack`, the Pulumi slice that
resolves every `ref:` fact from the stack config and checks its shape.
