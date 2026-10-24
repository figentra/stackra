# Feature Specification: `@stackra/peripherals` wave 4, point-of-sale peripherals

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/peripherals` (experience, wave 4) for real: printers, scanners, scales and the cash drawer
(ADR 0253). Entries `.`, `./contracts` and the runtime-target entry `./electron`. The template imports
`PeripheralsConfig` from `.`, `BarcodeScanner`, `CashDrawer` and `ReceiptPrinter` from `./contracts`, and
`PrintReceiptBridge` with the `escpos`, `printer_kick` and `hid` drivers from `./electron`; its generated desktop wiring
also imports the three memory drivers from `.`. A peripheral is a capability of `@stackra/platform` with drivers per
target, and the Electron side is a bridge the preload exposes.

## Impact

- **Apps touched**: none (the template console's `PeripheralsConfig` override and its generated desktop wiring consume
  it; STA-344)
- **Services touched**: none
- **Packages touched**: `packages/experience/peripherals` (new member)
- **Cross-service events**: none
- **Tenancy and data**: none; receipt lines go to the printer and scanned codes to listeners, nothing is stored or
  logged; no scope vocabulary is needed (R-59)
- **Secrets**: none; a printer address is a local network address or a device path, not a secret
- **ADR needed**: no (ADR 0253, 0250, 0251 as amended by 0294, 0254; ADR 0294 decisions 4, 15 to 17, 19, 20, 26; ADR
  0127 2026-10-24 note and the owner's answer to registry Q4 for `./electron`)
- **New dependencies**: none outside existing catalogs; runtime edges to `@stackra/config`, `@stackra/container`,
  `@stackra/contracts`, `@stackra/errors`, `@stackra/platform`, `@stackra/validation` and `zod`; `electron`
  (`catalog:desktop`) as an optional peer and a dev dependency; `@types/react` (`catalog:frontend`, dev) for
  `@stackra/platform`'s types
- **Deploy modes**: same in all; isomorphic `.` and `./contracts`, `./electron` in the desktop main process only
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/experience/peripherals/README.md`, `packages/experience/peripherals/AGENTS.md`; ADR 0250, 0251, 0253, 0254, 0266, 0269 and 0294 are cited and amended only by a note if a decision here changes
- **Lane**: lite (a new package following an accepted ADR and the registry row)
- **Change risk**: R2 (the bridge is a security boundary between the renderer and main, and a print or drawer call
  touches real hardware)

## Clarifications

### Session 2026-10-24

The package follows the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and v3.1, ADR
0294, 0305). The choices recorded when it was specified:

- Owner answer to registry Q4: a runtime-target entry named after an ADR 0295 decision 8 target is allowed, so
  `./electron` stays; no `./browser` entry is in the row, so no web driver ships yet.
- ADR 0253 decision 3: no native module. Main reaches a printer over `node:net` (`tcp://`) or a device path, and a
  keyboard-wedge scanner through every window's `before-input-event`; a scale needs a serial line, so only its memory
  driver ships and the limit is documented.
- ADR 0250 decision 3: every call resolves the `CapabilityResult` of `@stackra/platform`, refusing on `print` (printer,
  drawer), `scanner` or `serial` (scale); the bridge turns a refusal into `PrinterUnavailableError`.
- The driver names equal the template's generated `DriverRegistry` unions (`escpos | memory`, `printer_kick | memory`,
  `hid | memory`), because both augment the same keys.
- The bridge answers `{ printer, orderId }` for `{ orderId, lines }`, the shape the template's desktop e2e asserts.

## User Scenarios & Testing

### User Story 1 - Print a receipt from the desktop renderer (Priority: P1)

The console's POS screen calls `window.stackra.invoke("peripherals.receipt.print", { orderId, lines })`; main's
`PrintReceiptBridge` prints on the bound `ReceiptPrinter` and answers `{ ok: true, data: { printer } }`.

**Independent Test**: `packages/experience/peripherals/src/electron/bridges/__tests__/print-receipt.bridge.test.ts`,
`packages/experience/peripherals/src/electron/drivers/__tests__/escpos-receipt-printer.driver.test.ts`.

**Acceptance Scenarios**:

1. **Given** a receipt, **When** the bridge handles it, **Then** the printer prints it and the answer names the
   printer and the order.
2. **Given** a malformed or oversized input, **When** the bridge handles it, **Then** it throws `TypeError` before the
   printer is touched.
3. **Given** no reachable printer, **When** the bridge handles a receipt, **Then** it throws `PrinterUnavailableError`.

### User Story 2 - Open the drawer and scan at the till (Priority: P1)

Main binds `PrinterKickCashDrawerDriver` and `HidBarcodeScannerDriver`; a drawer open pulses the configured pin through
the printer, and a scanner's burst ending in Enter reaches every `onScan` listener.

**Independent Test**: `packages/experience/peripherals/src/electron/drivers/__tests__/printer-kick-cash-drawer.driver.test.ts`,
`packages/experience/peripherals/src/electron/drivers/__tests__/hid-barcode-scanner.driver.test.ts`.

**Acceptance Scenarios**:

1. **Given** `drawerPin: 5`, **When** the drawer opens, **Then** the printer receives the pulse for pin 5.
2. **Given** keys typed within `scanKeyGap` and an Enter, **Then** the listener receives the code; slow typing, a
   short burst, held keys and shortcuts deliver nothing.

### User Story 3 - Configure and test peripherals (Priority: P1)

The console overrides `PeripheralsConfig` with `escpos`, `printer_kick`, `hid` and `probeOnBoot`; a test binds the
memory drivers and reads what was printed, opened or scanned.

**Independent Test**: `packages/experience/peripherals/src/config/__tests__/peripherals.config.test.ts`,
`packages/experience/peripherals/src/core/drivers/__tests__/memory-receipt-printer.driver.test.ts`.

**Acceptance Scenarios**:

1. **Given** the base, **Then** its key is `peripherals` and an override keeps it.
2. **Given** an unknown driver or an address no driver can reach, **Then** `buildConfig` throws `ConfigInvalidError`.

### Edge Cases

- A receipt line with control bytes or non-ASCII characters: printed as `?`, never as a printer command.
- A device path that does not exist: opened without creating it, so the call refuses instead of writing a file.
- `EACCES` or `EPERM` on the device: `permission_denied`; any other failure or a timeout: `unavailable`.
- A listener unsubscribing before Electron loaded: no input listener is attached.
- A window created after the first subscription: watched as well.

## Requirements

- **FR-001**: The package SHALL be `@stackra/peripherals` at `packages/experience/peripherals`, `tier:lib`, with
  entries `.`, `./contracts` and `./electron` only, and dependencies on workspace packages and catalog versions only.
- **FR-002**: `./contracts` SHALL export the `ReceiptPrinter`, `CashDrawer`, `BarcodeScanner` and `Scale` ports and
  the types their signatures name; it imports no other entry; every call that may fail resolves a `CapabilityResult`.
- **FR-003**: `.` SHALL export `PeripheralsConfig` (key `peripherals`) with its shipped schema `PeripheralsConfig$`,
  the four memory drivers and `PrinterUnavailableError`; the driver fields SHALL take exactly the shipped driver names.
- **FR-004**: `./electron` SHALL export `PrintReceiptBridge` (`receipt.print`, capability `print`), which validates the
  renderer's input and turns a printer refusal into `PrinterUnavailableError`.
- **FR-005**: `EscposReceiptPrinterDriver` SHALL send ESC/POS bytes over TCP or to an existing device path, printing
  lines as printable ASCII only, and `PrinterKickCashDrawerDriver` SHALL open the drawer through the bound printer.
- **FR-006**: `HidBarcodeScannerDriver` SHALL deliver a keyboard-wedge burst as a scan with no native module, and no
  `./electron` module SHALL load Electron or a Node module at load time.

## Success Criteria

- **SC-001**: Spec, plan, tasks and a changeset exist.
- **SC-002**: Every public symbol has a test in `src/**/__tests__/`; the tests run in the separate testing workflow
  (owner mode, 2026-10-24: not run here).
- **SC-003**: `oxfmt` and `oxlint` are clean on the package and `validate-repository` reports nothing for it.

## Open items (for the owner, not blocking)

- Browser drivers (WebUSB printer, WebHID scanner, WebSerial scale) need a `./browser` entry, which the registry row
  does not list; they wait for the first web till.
- `probeOnBoot` is read by the app runtime's boot, which calls each bound port's `probe()`; that boot step belongs to
  the runtime package, not here.
- A per-machine printer address: runway sets it per environment, but a till's printer is per machine; a machine-local
  config layer or a settings screen is a later decision.
- ADR 0253's device presets (the POS kit, the attendance kit) are configuration profiles; the attendance kit's NFC and
  card reader have no port yet.
- The template's generated desktop wiring lists no `deps` for the drivers; gen must emit them from the constructor
  types (`PeripheralsConfig`, `ReceiptPrinter`, `Clock`).

## Status history

- 2026-10-24 · — → Implementing · Claude (desktop-pwa-builder) · spec for a package written in owner mode (develop now, test later)
