<!-- Purpose: the agent guide of @stackra/native-spotlight: where code goes, the package's rules and its PII. Boundary: this package only. Runtime: docs. Governing contract: ADR 0478, ADR 0333, ADR 0189. -->

# AGENTS — @stackra/native-spotlight

On-device search (iOS Core Spotlight, Android launcher search) behind the `DeviceSearchIndex` port (ADR 0478). Member
at `packages/experience/native-spotlight` (`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries
`.`, `./contracts`, `./native`; `app.plugin.js` for Expo CLI.

## Where code goes

| You are writing…                       | It goes in…                                                        |
| -------------------------------------- | ------------------------------------------------------------------ |
| The port or a type its signature names | `src/contracts/ports/`, `src/contracts/types/`                     |
| The configuration                      | `src/config/spotlight.config.ts`, its shape in `src/core/schemas/` |
| A visibility rule                      | `src/core/functions/indexable-items.function.ts`                   |
| The memory driver, the indexer         | `src/core/drivers/`, `src/core/services/`                          |
| The Expo driver and the module type    | `src/native/drivers/`, `src/native/types/`                         |
| Swift                                  | `ios/` (Core Spotlight is a system framework; no vendor pod)       |
| Kotlin                                 | `android/src/main/java/com/figentra/stackra/spotlight/`            |
| Plist and manifest entries             | the config plugin, `plugin/src/`                                   |
| A test                                 | `__tests__/<name>.<kind>.test.ts` beside it                        |

## This package

- The native module is a pass-through (ADR 0478 decision 5); every rule of what may be indexed lives in TypeScript,
  in `indexableItems`, where it is tested.
- Only the signed-in person's own records, of a listed kind, never sensitive ones. A new rule narrows; nothing here
  widens what the server's record visibility (ADR 0333) allowed.
- Everything is cleared on sign-out and on a revoked session (`clearOnSignOut`). An erased account reaches the device
  as a revoked session; the device never hears `SubjectErased` itself.
- An entry's identity is its deep link on both platforms.
- `src/*/index.ts` are stand-in barrels until gen writes them (STA-339); add every public file to its barrel and its
  `index.test.ts`.
- Nothing runs on a developer Mac: the Swift and Kotlin are checked on devices.

## PII

Titles, descriptions and keywords of the person's own records are written to the phone's search index, on the
device only. iOS keeps them under complete file protection. They are removed on sign-out and revocation.
