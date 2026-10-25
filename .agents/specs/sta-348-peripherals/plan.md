# Plan: `@stackra/peripherals` wave 4

**Spec**: `.agents/specs/sta-348-peripherals/spec.md`

## Design

- Three entries through stand-in barrels (STA-339 replaces them): `.` from `src/core/`, `./contracts` from
  `src/contracts/` (the leaf), `./electron` from `src/electron/`. `src/config/` holds `PeripheralsConfig`.
- Ports in `src/contracts/ports/`, each keyed by a type-only `~key` so `DriverName<Port>` narrows; their results reuse
  `CapabilityResult` from `@stackra/platform/contracts`, and refusals are built by an internal `refuse`.
- Configuration copies the pairing of `NotificationsConfig`: `PeripheralsOptions` (a `Schema` shape) registers the
  shipped `PERIPHERALS_CONFIG_SCHEMA`, and `PeripheralsConfig extends Config({ schema: PeripheralsOptions })`. The
  driver names live in `PERIPHERAL_DRIVERS` and reach `DriverRegistry` through one augmentation file.
- ESC/POS is two pure functions in `src/core/functions/`: `escposReceipt(lines)` (init, ASCII text, feed, partial cut)
  and `escposDrawerKick(pin)` (`ESC p`).
- `./electron`: `PrintReceiptBridge extends Bridge({ key: "receipt.print", capability: Capability.Print })` from
  `@stackra/platform/electron`; `EscposReceiptPrinterDriver(config)` sends over `node:net` or opens a device path with
  `O_WRONLY`; `PrinterKickCashDrawerDriver(printer, config)` delegates to `kickDrawer`;
  `HidBarcodeScannerDriver(config, clock)` watches `before-input-event` on every web contents from the first listener
  to the last. Electron and Node modules load inside the calls.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                             |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/experience/peripherals`; imports only lower `@stackra/*` packages through their entries; no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged; a printer address is not a secret                                                                           |
| Security                              | PASS   | the bridge validates renderer input and bounds it; lines print as text only, so no line reaches the printer as a command                         |
| HTTP and events                       | N/A    | no endpoint and no event; the bridge is IPC through the generated preload                                                                        |
| Tenancy                               | N/A    | no tenant-owned data and no scope vocabulary (R-59)                                                                                              |
| Delegation                            | PASS   | `desktop-pwa-builder` writes the code and tests; a separate reviewer (`code-reviewer`, `security-tenancy-reviewer` for the bridge)               |
| Not built yet (ADR 0227)              | PASS   | no Tauri, no native module, no sync engine                                                                                                       |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                        |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                |
| Deploy modes (ADR 0076)               | PASS   | a library with no network of its own beyond the local printer, identical in SaaS, on-prem and air-gapped                                         |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                               |
| Docs and ADRs                         | PASS   | README (with the targets and limits table), AGENTS, file contracts and TSDoc; the cited ADRs stand, open items listed in the spec                |

- Boundaries: runtime edges to config, container, contracts, errors, platform and validation; Electron as an optional
  peer; dev-only `@stackra/testing` and the tooling presets.
- Naming: drivers `<Name><Port>Driver` after their file prefix (`escpos`, `printer_kick`, `hid`, `memory`); the bridge
  `PrintReceiptBridge`; the refusal `PrinterUnavailableError` (code `printer_unavailable`).

## Properties

- **P-001**: `package.json` names `@stackra/peripherals` at `packages/experience/peripherals`, `exports` lists exactly `.`, `./contracts` and `./electron`, and every dependency is `workspace:*` or `catalog:` — Validates: FR-001
- **P-002**: `./contracts` exports exactly the four ports at run time, each a `Port` keyed `peripherals.<Port>` whose drivers are instances of it — Validates: FR-002
- **P-003**: `buildConfig(PeripheralsConfig)` equals `PERIPHERALS_CONFIG_SCHEMA.parse({})`, every driver name outside `PERIPHERAL_DRIVERS` throws, and `.` exports exactly its listed values — Validates: FR-003
- **P-004**: For every input, the bridge either prints exactly `{ orderId, lines }` and answers the printer's `PrintedReceipt`, or throws `TypeError` with nothing printed, or throws `PrinterUnavailableError` when the printer refuses — Validates: FR-004
- **P-005**: For every list of lines, `escposReceipt` starts with `ESC @`, ends with the feed and cut, and contains only bytes 0x20 to 0x7E between line feeds; the drawer driver sends exactly `escposDrawerKick(drawerPin)` — Validates: FR-005
- **P-006**: For every key sequence, a scan is delivered exactly when at least three characters arrive within `scanKeyGap` of each other followed by Enter, with no auto-repeat or modifier key in between; loading `./electron` imports no Electron module — Validates: FR-006

## Deploy modes

| Mode       | Behaviour                                                                         |
| ---------- | --------------------------------------------------------------------------------- |
| SaaS       | a library in the desktop client; talks only to the till's own printer and windows |
| On-prem    | identical: the same build, no SaaS-only code path                                 |
| Air-gapped | identical: needs no network beyond the local printer address                      |
