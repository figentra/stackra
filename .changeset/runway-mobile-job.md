---
"@stackra/runway": minor
---

`./node` gains the mobile job (ADR 0439): `runMobileJob(request)` builds one app of the root runway's `mobile` from a
checkout of its OS template line, started by a merge or, with a `variant`, by an OS event for a scope (white-label).
It checks the store accounts and the white-label mode, refuses a white-label build under the platform's Apple account
until `<store>/apple-guidelines.json` records guidelines 4.2.6 and 4.3 as passed, writes the Expo `app.json` (runway
identity, runtime version from the template line, EAS project) and `expo.autolinking.exclude`, and starts `eas build`
through `EasProviderDriver`. `capabilityConfig(catalogue, flags)` turns the template's `capabilities.json` into the
plugins to run and the modules, plugins, Info.plist keys, entitlements and Android permissions to strip, refusing a
flag the line does not offer. New types `MobileApp`, `MobileCapability`, `ExpoPluginEntry`, `MobileCapabilityConfig`,
`MobileStoreAccount`, `MobileVariant`, `MobileJobRequest`, `MobileJobResult`.
