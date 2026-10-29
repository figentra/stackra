<!-- Purpose: the agent guide of @stackra/native-share: where code goes, the package's rules and its PII. Boundary: this package only. Runtime: docs. Governing contract: ADR 0478, ADR 0255. -->

# AGENTS — @stackra/native-share

Receiving shares from other apps on iOS and Android behind the `IncomingShare` port (ADR 0478). Member at
`packages/experience/native-share` (`tier:lib`). Entries `.`, `./contracts`, `./native`, `./react`; `app.plugin.js`
for Expo CLI.

## Where code goes

| You are writing…                      | It goes in…                                                           |
| ------------------------------------- | --------------------------------------------------------------------- |
| The port or a type it speaks          | `src/contracts/ports/`, `src/contracts/types/`                        |
| A check every driver applies          | `IncomingShareDriver` in `src/core/drivers/`                          |
| A driver                              | `src/core/drivers/` (memory), `src/native/drivers/` (Expo)            |
| The configuration                     | `src/config/native-share.config.ts`, its shape in `src/core/schemas/` |
| The share extension or intent filters | the config plugin, `plugin/src/` (it applies expo-sharing's)          |
| A string an app shows for a share     | `assets/lang/<locale>/native_share.json`, every locale                |
| A test                                | `__tests__/<name>.test.ts` beside it                                  |

## This package

- No Swift or Kotlin: expo-sharing ships both sides (ADR 0478 decision 2). Native code here would need
  `expo-module.config.json`, `ios/` and `android/`, and an ADR-level reason expo-sharing cannot do it.
- Never read expo-sharing's resolved payloads: they fetch shared links from the network unasked.
- Business limits are `NativeShareConfig` fields, never constants; the plugin parses its props with the same schema.
- A refusal is a dropped item or a `null` read, never an exception.

## PII

Shared items can hold anything a person chose to share (photos, documents, text). They stay on the device until the
app uploads or keeps them; never log an item's value or bytes.
