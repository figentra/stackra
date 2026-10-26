# Feature Specification: accessible kiosk mode, scale streams, exit gates, device kinds and native customer displays

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-801

**Clarifications status**: complete

**Input**: Accessible `kiosk` surface mode (audio, reach layout, high contrast, idle reset) and the kiosk lock on launch;
continuous-weight `Scale` events; exit check as an `AccessController` scan of a signed receipt token; device-catalogue
kinds kiosk, lane, lane display and gate; Android Presentation and iPad external-display customer display drivers. The
RFID reader port is later (MUS-90).

## Impact

- **Apps touched**: apps/mobile (native sources of the customer display module)
- **Services touched**: none
- **Packages touched**: packages/design-system/ui, packages/experience/platform, packages/experience/peripherals,
  packages/runtime/devices
- **Cross-service events**: none
- **Tenancy and data**: none stored; the gate remembers used receipts in memory
- **Secrets**: the receipt-signing private key (the signer's, in the secret store); gates hold only the public key
- **ADR needed**: yes, 0428, 0429, 0430 (Proposed)
- **New dependencies**: none
- **Deploy modes**: same everywhere
- **Lane**: lite
- **Change risk**: R2

## Requirements

- **FR-001** `KioskSurface` (web and native) resets after `idleTimeoutMs` without input, lays out `standing` or `seated`
  reach, carries high contrast, and announces through a live region or the screen reader and, with audio on, aloud.
- **FR-002** `KioskConfig` (`platform.kiosk`) holds the defaults; `enterKioskOnLaunch` enters `KioskMode` when the
  device setting or config asks, answering a refusal instead of throwing.
- **FR-003** `Scale.onWeight` streams every weight change.
- **FR-004** `AccessController` port with a `memory` driver; `signReceiptToken`, `verifyReceiptToken`,
  `importReceiptPublicKey` (Ed25519, Web Crypto); `ExitGateService` opens once per fresh, same-node, unused,
  rule-admitted token and reports every decision.
- **FR-005** `BASE_DEVICE_CATALOGUE` (till, kiosk, lane, lane display, gate) and `deviceCatalogueOf`.
- **FR-006** `ExternalCustomerDisplayDriver` (`peripherals.customerDisplay: "external"`) over the
  `StackraCustomerDisplay` Expo module: Kotlin `Presentation` and Swift external-scene sources in
  `apps/mobile/src/native-sources/customer-display/`.

## Acceptance (from Linear)

- Kiosk mode passes an accessibility audit: planned, the playground e2e axe suite once a kiosk page exists.
- Scale streams weight events: FR-003.
- Gate opens on a valid signed receipt token: FR-004.
- Android and iPad customer display drivers: FR-006.

## Not built here

- `createApp` in `@stackra/app` (packages/runtime/app, outside this run's folders) must call `enterKioskOnLaunch` once
  after boot on each target.
- Gen must wire the `StackraCustomerDisplay` module and the iPad external-display scene manifest (ADR 0345 decision 7);
  the native sources are not compiled until an EAS build. The iPad scene is still the spike STA-475.
- A gate controller driver and a shared used-receipt store for multi-exit venues.
- A token high-contrast palette (only the stronger material edge is applied).
- The RFID reader port (MUS-90, later).
- Tests are written but not run (owner mode).
