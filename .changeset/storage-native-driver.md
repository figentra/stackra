---
"@stackra/storage": minor
---

Add the `./native` entry with `NativeStorageDriver`: `prefs`, `session`, `cache`, `outbox` and `files` on
react-native-mmkv (one instance per area, `stackra.<area>`), `secrets` on expo-secure-store (keychain and keystore).
Both modules are optional peers.
