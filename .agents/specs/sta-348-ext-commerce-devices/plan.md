# Plan: extend money, pricing, loyalty-kit, peripherals, devices and platform

**Spec**: `.agents/specs/sta-348-ext-commerce-devices/spec.md`

## Design

- **money**: a `./contracts` entry for `RateSource`; exact decimal helpers (`decimalParts`, `formatDecimal`,
  `shiftDecimal`, `decimalProduct`); `Money`'s private `toRatio` reads a decimal string, so `times` and `divide` take
  rates and unit prices digit for digit. `ExchangeRate` scales across exponents with `shiftDecimal`.
- **pricing**: a `./contracts` entry for `TaxProvider`. `resolvePrice` filters applying lists, sorts by specificity
  (channel 2, Market 1) then given order, and evaluates the first that prices the item; derived lists recurse with a
  cycle guard. `taxByRates` matches `country-region` then `country`.
- **peripherals**: three ports in `./contracts`; `sendToPrinter` extracted from the ESC/POS driver and shared with the
  ZPL driver; `zplRaster` encodes `^GFA`; the label bridge accepts one safe ZPL label or a packed raster.
- **devices**: the registry is server-side (memory driver here, the devices service's own store later); the pairing
  driver posts the install id, polls, and stores the token in `secrets`.
- **platform**: Electron drivers load Electron lazily; the second-screen window has no preload and the main window's
  origin.
- **loyalty-kit**: `earnVisit` appends stamps as `Earn` entries; the action reads the two settings.

## Constitution Check

| Law                                   | Result | Note                                                                     |
| ------------------------------------- | ------ | ------------------------------------------------------------------------ |
| Boundaries (tier direction, ADR 0003) | PASS   | all `tier:lib`; new edges to `container` and `storage` only              |
| Secrets (ADR 0173)                    | PASS   | no secret in code or config; the device token stays in `secrets` storage |
| Security                              | PASS   | bridges validate renderer input; ZPL host commands refused; same origin  |
| HTTP and events                       | PASS   | two hub routes documented in `DEVICE_HUB_PATHS`; one new action route    |
| Tenancy                               | N/A    | no new table                                                             |
| Configuration over code (ADR 0363)    | PASS   | every policy value is data or a setting                                  |
| Test placement (ADR 0022)             | PASS   | every test in `src/**/__tests__/`                                        |
| Versions and catalogs                 | PASS   | `workspace:*` and existing catalogs only                                 |
| Docs and ADRs                         | PASS   | README, AGENTS and file contracts; ADR gaps raised as owner questions    |
