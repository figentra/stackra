---
"@stackra/identity": minor
---

Add the `Passkeys` port (`./contracts`) for the device step of a passkey registration or sign-in against the identity
provider, with `PasskeyRefusal` and the WebAuthn option and credential types; `MemoryPasskeysDriver` (`.`) for tests
and web, and `ExpoPasskeysDriver` (`./native`) over `react-native-passkey` (iOS 15+, Android 9+), mapping its errors
to refusals (STA-1538). New optional peer: `react-native-passkey`.
