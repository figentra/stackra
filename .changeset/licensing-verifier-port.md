---
"@stackra/licensing": minor
---

Add the `LicenceVerifier` port with `KeygenLicenceVerifierDriver`, and `LicensingConfig` (`apiUrl`, `account`,
`publicKey`, with `LicensingConfig$`). The Keygen origin is no longer a constant in code: `checkLicenceKey` without a
`baseUrl` reads the configuration's default.
