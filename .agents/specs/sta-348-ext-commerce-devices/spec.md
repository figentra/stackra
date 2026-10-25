# Feature Specification: extend `@stackra/money`, `pricing`, `loyalty-kit`, `peripherals`, `devices` and `platform`

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-25

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: The rows of `notes/handover/stackra-package-needs.md` for `@stackra/money`, `@stackra/pricing` (with the
"Tax provider port" row), `@stackra/loyalty-kit`, `@stackra/peripherals`, `@stackra/devices` and `@stackra/platform`,
and the "Conflicts to settle" section (recommended options; #3 registry and pairing in `@stackra/devices`, #6 loyalty
points stay on `@stackra/loyalty-kit`). Governing ADRs: 0220, 0244 (d6, d9 and the STA-451 note), 0205 (STA-474 note),
0337, 0339 (d1, d2, d5, d7), 0235 and 0361 (d7), 0281 (STA-469 note), 0344. Configuration principle:
`notes/handover/config-model.md`.

## Impact

- **Apps touched**: none
- **Services touched**: none (OS pricing, payments, devices, parties and the products consume these later)
- **Packages touched**: `packages/commerce/money`, `packages/commerce/pricing`, `packages/commerce/loyalty-kit`,
  `packages/experience/peripherals`, `packages/runtime/devices`, `packages/experience/platform`
- **Cross-service events**: none new (`loyalty_kit.points.earned` is reused by the stamp card)
- **Tenancy and data**: no new table. Rates, tax tables, cash rounding rows, barcode layouts, stamp counts, markups and
  price points arrive as data (market packs, catalogue records, settings)
- **Secrets**: none. The device's pairing token lives only in the `secrets` storage area on the device
- **ADR needed**: none written here. Items an ADR should settle are owner questions (see Clarifications)
- **New dependencies**: none third-party. New workspace edges: `money` → `container`; `pricing` → `container`;
  `devices` → `storage`
- **Deploy modes**: same in all
- **Licence tier**: free (MIT)
- **Docs to update**: each package's README and AGENTS
- **Lane**: full (six packages, new ports)
- **Change risk**: R2 (money arithmetic, tax and pricing; no auth or tenant data path changes)

## Clarifications

### Session 2026-10-25

- Pricing's "pure evaluation package" (ADR 0205 STA-474 note, ADR 0337) is `@stackra/pricing` itself: `resolvePrice`,
  `evaluateFormula` and `taxByRates` are pure functions over a replica, so the till and the OS pricing service share
  them. No second package.
- The "price from formula" kind is a data discriminant of a price entry (`PriceKind.Formula`), not a programming-model
  kind; registry A9 (a pricing kind needs an ADR) is not triggered.
- The channel dimension: a price list carries `channel` beside `market`; a channel list is usually derived from a base
  list with a markup factor and a price point (the restaurant's delivery-app list).
- The tax provider port lives in `@stackra/pricing` (`./contracts`), because tax is calculated on the Market, in
  pricing (ADR 0244 STA-451 note). Own tables are `taxByRates`; the US provider driver is an OS integration connector.
- Rates: `RateSource` (port) and `RateSnapshot` (data) in `@stackra/money`; the metal-rate feed is a `RateSource` with
  a commodity pair (`XAU` per `gram`). The source per market is the market pack's key.
- Conflict #3: registry and pairing ports in `@stackra/devices`. Conflict #6: points stay on `@stackra/loyalty-kit`.
- A device's id is its install id, minted once and registered at pairing, so the offline queue's per-device order
  (ADR 0338 d1) survives pairing.
- The customer display is a second window of the app fed over a same-origin `BroadcastChannel`; `@stackra/platform`
  places the window (`SecondScreen`), `@stackra/peripherals` feeds it (`CustomerDisplay`, `channel` driver).
- `CardTerminal` pairs and reports only; the payment protocol stays with the payments driver (ADR 0339 d1).
- The RFID reader port is "later" in its row and is not built.

## User Scenarios & Testing

### User Story 1 - A till prices a basket offline exactly as the server will (Priority: P1)

**Acceptance Scenarios**:

1. **Given** a base list, a Market list and a delivery-app channel list derived from the base with a markup and a
   price point, **When** an item is priced for that channel, **Then** the channel list applies and the sources name
   both lists with their revisions.
2. **Given** an 18-carat ring priced by formula and the cart's gold rate snapshot, **When** it is priced, **Then** the
   unit price is fine gold at the rate plus the making charge, each rounded once, and the snapshot is returned.
3. **Given** a market's VAT table, **When** an inclusive line is taxed, **Then** the tax is taken out of the price.

### User Story 2 - The POS kit beyond receipts (Priority: P1)

1. **Given** a ZPL label printer on the LAN, **When** the renderer prints a label through the bridge, **Then** main
   sends the ZPL with its copies; a `~` or `^J` command is refused.
2. **Given** a second display, **When** the till opens the customer display and shows a basket, **Then** the display
   window renders it.
3. **Given** a market's scale barcode layout, **When** a weight barcode is scanned, **Then** the item code and the
   weight are read and a bad check digit gives `null`.

### User Story 3 - Devices pair and are registered (Priority: P1)

1. **Given** a till showing a pairing code, **When** a person enters it in the console, **Then** the registry holds the
   device under its install id and the till keeps its token in `secrets`.

### User Story 4 - Stamp cards (Priority: P2)

1. **Given** `stampsPerVisit` 1 and `stampsPerCard` 10, **When** a visit is stamped twice with the same reference,
   **Then** one stamp is credited and the card shows its progress.

## Requirements

- **FR-001** (money): `RateSource` port, `RatePair`/`RateSnapshot`, `ExchangeRate` (convert, priceOf),
  `MemoryRateSourceDriver`; `CashRounding` over a pack row; `UnitPrice` with six decimals; `decimalProduct`;
  `Money#times` and `#divide` take a decimal string.
- **FR-002** (pricing): `PriceKind`, `resolvePrice` over `PriceList` (currency, Market, channel, dates, adjustment),
  `evaluateFormula`, `taxByRates`, `TaxProvider` port with `MemoryTaxProviderDriver`.
- **FR-003** (peripherals): `LabelPrinter`, `CustomerDisplay`, `CardTerminal` ports with memory drivers;
  `ChannelCustomerDisplayDriver` and `listenCustomerDisplay`; `ZplLabelPrinterDriver` and `PrintLabelBridge`;
  `parseEmbeddedBarcode`; config fields for the three drivers and the label printer address.
- **FR-004** (devices): `DeviceRegistry` and `DevicePairing` ports, `MemoryDeviceRegistryDriver`,
  `HttpDevicePairingDriver`, `StoredDeviceIdentityDriver`, `StoredDeviceCredentialDriver`.
- **FR-005** (platform): `KioskMode` and `SecondScreen` ports, memory and Electron drivers, `SetKioskModeBridge`,
  `ShowSecondScreenBridge`, `DesktopConfig.kioskOnLaunch`, `Capability.CardTerminal`.
- **FR-006** (loyalty-kit): `AccountService.earnVisit`, `EarnVisitAction`, `stampCardProgress`, the `stamp`
  permission and the `stampsPerVisit`/`stampsPerCard` settings.
- **FR-007**: No country, rate, tax class, markup, price point, barcode prefix, stamp count or provider choice is
  written in source; tests use made-up fixtures.
- **FR-008**: Existing public API keeps working; additions only.

## Success Criteria

- **SC-001**: Every item of the six rows is built or listed as unmet with its reason.
- **SC-002**: Every new public symbol has a test beside it (run later in the testing workflow; owner mode).
