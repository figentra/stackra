---
"@stackra/platform": minor
"@stackra/peripherals": patch
"@stackra/navigation": patch
---

Breaking renames for unique public names (STA-1383): `@stackra/platform` `Capability` is `PlatformCapability` (iam's
`Capability` is the permission capability), and the `@stackra/platform/contracts` port `PushTransport` (this device's
push registration) is `PlatformPushTransport`, keyed `platform.PlatformPushTransport` (notifications' `PushTransport`
is the server send). Drivers keep their names; importers in peripherals and navigation are updated.
