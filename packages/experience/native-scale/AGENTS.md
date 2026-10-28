<!-- Purpose: the agent guide of @stackra/native-scale: where code goes, the package's rules and its PII. Boundary: this package only. Runtime: docs. Governing contract: ADR 0478, ADR 0253, ADR 0339. -->

# AGENTS — @stackra/native-scale

The Expo module behind `@stackra/peripherals`' `Scale` port (ADR 0478). Member at `packages/experience/native-scale`
(`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entry `.`; `app.plugin.js` for Expo CLI.

## Where code goes

| You are writing…                          | It goes in…                                                                                              |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| A protocol driver                         | `src/core/drivers/<protocol>-scale.driver.ts`, extending `Driver(Scale)`                                 |
| A protocol's line parser                  | `src/core/functions/parse-<protocol>-line.function.ts`                                                   |
| A protocol's makers, terminator, commands | `SCALE_PROTOCOLS` in `src/core/constants/` (pack data) and `ScaleProtocolName`                           |
| The configuration                         | `src/config/native-scale.config.ts`, its shape in `src/core/schemas/`                                    |
| Swift                                     | `ios/` (the podspec declares any vendor SDK, and only it)                                                |
| Kotlin                                    | `android/src/main/java/...`; the USB link in `android/src/usb`, its refusing twin in `android/src/nousb` |
| Permissions, plist and manifest entries   | the config plugin, `plugin/src/`                                                                         |
| A test                                    | `__tests__/<name>.<kind>.test.ts` beside it                                                              |

## This package

- The port is `Scale` from `@stackra/peripherals/contracts`, unchanged; never add a field to `ScaleReading`. The full
  legal-for-trade reading is `frame()` on the drivers (`ScaleFrame`).
- The native side is a byte pipe (ADR 0478 decision 5): `connect`, `disconnect`, `isConnected`, `write` and the
  `onData` event. Framing, parsing, unit conversion and refusals stay in TypeScript, where they are tested.
- Every refusal is on capability `serial` (`refuse` in `src/core/functions/`). `E_PERMISSION` from the module maps to
  `permission_denied`; anything else, an overload, an underload, a busy scale or no answer to `unavailable`.
- Configuration, not code: a scale model's terminator or command set is a `protocols` entry. A new protocol is a driver,
  a parser, a `ScaleProtocolName` and a pack entry.
- A test or a mock never produces a legal-for-trade reading; the fixture's lines are transcribed from public manuals
  until certification records real ones (STA-739).
- No module of `src/` imports a native package: the drivers read `StackraNativeScale` from `globalThis.expo.modules`
  when they run, so the entry loads on web and desktop and refuses there.
- Nothing runs on a developer Mac: Swift and Kotlin are checked on the box and on certified models.

## PII

None. A scale address is a device identifier, and weights are not personal data.
