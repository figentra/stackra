# @stackra/devices

## 0.1.0

### Minor Changes

- 2787c1e: Add `@stackra/devices`, the minimal device support of ADR 0235: the `DeviceTelemetry` port (`report(readings)`), the
  `DeviceCommands` port (`pending()`, `acknowledge(commandId, status, detail?)`), the `DeviceCredential` port identity
  binds, the `CommandStatus` enum and the `TelemetryReading` and `DeviceCommand` types (all from `./contracts`); the
  `DevicesConfig` configuration (`devices.devices`: `hubUrl`, `timeoutMs`, `attempts`) with its shipped schema
  `DevicesConfig$`; and the HTTP drivers `HttpDeviceTelemetryDriver` and `HttpDeviceCommandsDriver` over
  `@stackra/transport` (idempotency key, bearer token, retry, timeout), which reject with `DeviceUnauthorizedError` on a
  401 or 403 and `DeviceHubRefusedError` on any other failure status, and the `DEVICE_HUB_PATHS` routes they call.
  
  For the offline queue (ADR 0338): the `DeviceIdentity` port (`./contracts`), the device's stable id every queued call
  carries, and the `./node` entry with `DeviceAcknowledgedQuery` (`devices.device.acknowledged@1`, `GET
  /devices/acknowledged`), which answers a device's last acknowledged sequence from `@stackra/actions`' device sequence
  store: the calling device's own, or a named device's within the caller's scope, so a shop knows what a lost till had
  not sent.
- f7a2d36: Export `PAIRING_CODE_ALPHABET` and `newPairingCode` from `.` so other registry drivers draw the same codes.
  `DeviceRegistry.claim` takes optional `DeviceClaimFacts` (`scopeId`, `market`, `pairedBy`), which `RegisteredDevice`
  carries and the memory driver stores. `DeviceKind` gains `counted` (the device limit) and `fiscalUnit`; the catalogue
  reader defaults them to `true` and `false`.
- 505ae77: Add the `DeviceRegistry` and `DevicePairing` ports (ADR 0361 decision 7) with `DeviceStatus`, `PairingState` and their
  types, `MemoryDeviceRegistryDriver`, `HttpDevicePairingDriver` (`POST /device-pairings`, `GET /device-pairings/:id`),
  and the `StoredDeviceIdentityDriver` and `StoredDeviceCredentialDriver` over `@stackra/storage`.
- 9277eeb: Kiosks, lanes and gates (STA-801, ADR 0428 to 0430): `KioskSurface` and `useKiosk` (web and native) with idle reset,
  reach layout, high contrast and audio announcements; `KioskConfig` (`platform.kiosk`) and `enterKioskOnLaunch`;
  `Scale.onWeight` weight streams; the `AccessController` port with its `memory` driver, Ed25519 receipt tokens
  (`signReceiptToken`, `verifyReceiptToken`, `importReceiptPublicKey`) and `ExitGateService`; the `external` customer
  display driver over the native `StackraCustomerDisplay` module; `BASE_DEVICE_CATALOGUE` and `deviceCatalogueOf`.
  `Scale` gains an abstract `onWeight`: a custom `Scale` driver must implement it.
- 9fc14fd: Put `@stackra/rules`, `@stackra/access-log`, `@stackra/scope`, `@stackra/market-packs`, `@stackra/devices`,
  `@stackra/collaboration` and `@stackra/payments` on the framework version line beside the packages the OS catalog
  already lists, with `@stackra/segments`, which `@stackra/iam` depends on and the catalog also lacks (STA-819).

### Patch Changes

- 0a7eaf1: Lint: the rule-gap B-3 autofix sweep (stackra-231, owner D11). `@stackra/oxlint-config` turns on
  `unicorn/numeric-separators-style`, `unicorn/switch-case-braces`, `unicorn/prefer-string-replace-all` and
  `unicorn/catch-error-name` at `error`. `unicorn/number-literal-case` stays off: it wants uppercase hex digits and oxfmt
  prints them lowercase, so the two would fight.
  
  The packages listed change no API and no behaviour. Long numeric literals carry `_` separators, every `case` body is a
  block, `.replace(/x/g, ...)` is `.replaceAll(...)` (a plain string where the pattern was a plain string), and a caught
  error is named `error`, or `<name>Error` where an outer `error` is in scope. Log and error `cause` fields keep their key.
- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [f81699d]
- Updated dependencies [f7fb4ad]
- Updated dependencies [e7a388a]
- Updated dependencies [68dd2a5]
- Updated dependencies [e0f2fc8]
- Updated dependencies [2787c1e]
- Updated dependencies [df3f38b]
- Updated dependencies [4413118]
- Updated dependencies [a6ec591]
- Updated dependencies [38fb3e2]
- Updated dependencies [bc4acfc]
- Updated dependencies [ae3d280]
- Updated dependencies [2787c1e]
- Updated dependencies [a1fd4d6]
- Updated dependencies [99665bb]
- Updated dependencies [8ead1a8]
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [e7ee0a4]
- Updated dependencies [a701ccb]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [6f2c1f7]
- Updated dependencies [67aa168]
- Updated dependencies [82a533d]
- Updated dependencies [2787c1e]
- Updated dependencies [3312ef3]
- Updated dependencies [f0c9f64]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [0e7eb1f]
- Updated dependencies [3d0354e]
- Updated dependencies [3b19f6d]
- Updated dependencies [b163445]
- Updated dependencies [074d3e8]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [ca44233]
- Updated dependencies [62a97c0]
- Updated dependencies [47554e7]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [8992b7a]
- Updated dependencies [d156aa8]
- Updated dependencies [2787c1e]
- Updated dependencies [2787c1e]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/actions@0.1.0
  - @stackra/config@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/iam@0.1.0
  - @stackra/storage@0.1.0
  - @stackra/transport@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
