---
"@stackra/gen": minor
---

A host's wiring can now list the phone ports `AppLock`, `Passkeys`, `LiveActivities`, `DeviceSearchIndex`, `IncomingShare` and `AppIcon` with their config rows, defaulting to the Expo driver on an Expo-only app and to memory on the web and in a service. An app with both web and native targets gets a `nativeWiring` beside `wiring`, and its native entry uses it, so the phone takes the native drivers instead of memory. A host gets these rows only once the manifests of `@stackra/platform`, `@stackra/identity`, `@stackra/native-spotlight` and `@stackra/native-share` are regenerated to carry their driver tables and config rows; the committed manifests do not carry them yet.
