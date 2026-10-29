<!-- Purpose: the agent guide of @stackra/native-customer-display: where code goes, the package's rules and its PII. Boundary: this package only. Runtime: docs. Governing contract: ADR 0478, ADR 0430. -->

# AGENTS — @stackra/native-customer-display

The Expo module behind `@stackra/peripherals`' `CustomerDisplay` port (ADR 0478). Member at
`packages/experience/native-customer-display` (`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305).
Entry `.`; `app.plugin.js` for Expo CLI.

## Where code goes

| You are writing…                        | It goes in…                                                         |
| --------------------------------------- | ------------------------------------------------------------------- |
| The driver                              | `src/core/drivers/external-customer-display.driver.ts`              |
| The module binding and its type         | `src/core/functions/`, `src/core/types/` (internal)                 |
| Swift                                   | `ios/` (SwiftUI and UIKit only; the podspec declares no vendor pod) |
| Kotlin                                  | `android/src/main/java/com/figentra/stackra/customerdisplay/`       |
| Permissions, plist and manifest entries | the config plugin, `plugin/src/`                                    |
| A test                                  | `__tests__/<name>.<kind>.test.ts` beside it                         |

## This package

- The port is `CustomerDisplay` from `@stackra/peripherals/contracts`, unchanged; the view crosses to the module as
  `CustomerDisplayView` JSON, so a new view field changes the Swift and Kotlin decoders with it.
- The module is `StackraCustomerDisplay` (`isAvailable`, `show`, `clear`); the name in `customerDisplayModule` equals
  the `Name(...)` of the Swift and Kotlin.
- Every refusal is on capability `window` with code `unavailable`: no module, no display, or a failed module call.
- No module of `src/` imports a native package: the driver reads the module from `globalThis.expo.modules` when it
  runs, so the entry loads on web and desktop and refuses there.
- Nothing runs on a developer Mac: Swift and Kotlin are checked on the box and on real displays.

## PII

The view holds basket lines and a total that the customer already sees at the till; nothing is stored or sent off the
device.
