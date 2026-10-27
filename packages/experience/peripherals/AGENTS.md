# AGENTS — @stackra/peripherals

Point-of-sale hardware: receipt, label and kitchen ticket printers, cash drawer, barcode scanner, bump bar, scale,
customer display, card terminal (pairing only), exit gates and their used-receipt store. Member at
`packages/experience/peripherals` (`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries `.`,
`./contracts`, `./desktop`.

## Where code goes

| You are writing…                     | It goes in…                                                          |
| ------------------------------------ | -------------------------------------------------------------------- |
| A port or a type its signature names | `src/contracts/ports/`, `src/contracts/types/`                       |
| The configuration                    | `src/config/peripherals.config.ts`, its shape in `src/core/schemas/` |
| The shipped `PeripheralsConfig$`     | `src/core/constants/peripherals-config-schema.constant.ts`           |
| A memory driver                      | `src/core/drivers/memory-<port>.driver.ts`                           |
| An encoder, a refusal builder        | `src/core/functions/`                                                |
| A refusal                            | `src/core/errors/<name>.error.ts`                                    |
| A main-process driver or bridge      | `src/desktop/drivers/`, `src/desktop/bridges/`                       |
| A test                               | `__tests__/<name>.<kind>.test.ts` beside it                          |

## This package

- A call a device cannot honour returns `refuse(capability, code)` from `src/core/functions/`; a programming error
  throws. Printers and drawer refuse on `print`, the scanner on `scanner`, the scale on `serial`, the customer display
  on `window`, the card terminal on `card_terminal`.
- Configuration, not code: barcode layouts (prefixes, digits, decimals, unit), certified printers and what a customer
  display shows are market-pack, seed-pack or settings data. Code holds the parsers and drivers only.
- `CardTerminal` pairs and reports; the payment protocol stays in the payments driver (ADR 0339 decision 1). A
  provider's SDK driver needs its own ADR (ADR 0339 open question 1).
- Kitchen printers are named in `kitchenPrinters`; a station sits on one printer at most, and item-to-station routing is
  the product's. A ticket with a `raster` prints the raster (Arabic is the renderer's, ADR 0339 decision 2).
- A bump bar keypad model is a `bumpBarKeys` map, a scale model a `scalePresets` entry: configuration, not code.
- `ExitGateService` claims a receipt in the bound `UsedReceiptStore` after the rule admits it and releases it when the
  gate fails to open (ADR 0449 decision 4).
- The label bridge accepts one ZPL label with no `~` or `^J` command, or a packed raster; never raw bytes.
- A new driver name goes into `PERIPHERAL_DRIVERS`; it must equal what gen writes for the port, because both augment
  the same `DriverRegistry` key.
- No native module (ADR 0253 decision 3): main reaches printers over `node:net` or a device path, and the scanner
  through `before-input-event`. A browser driver needs a `./browser` entry first.
- No module of `./desktop` imports Electron or a Node module at load time; each loads it when it runs.
- The bridge validates its input: it comes from the renderer. Lines are text, never printer commands.
- `src/*/index.ts` are stand-in barrels until gen writes them (STA-339); add every public file to its barrel and to
  that entry's `index.test.ts`.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII

| Data            | Where                              | Handling                                                                 |
| --------------- | ---------------------------------- | ------------------------------------------------------------------------ |
| Receipt lines   | `ReceiptPrinter.print`, the bridge | Sent to the printer only; never logged, never put in a refusal's details |
| Scanned codes   | `BarcodeScanner.onScan` listeners  | Handed to the listeners only; never stored here                          |
| Printer address | `PeripheralsConfig.printerAddress` | On the user's own network or machine; shown as `printer`, not a secret   |
| Label content   | `LabelPrinter.print`, the bridge   | Sent to the printer only; never logged, never put in a refusal's details |
| Kitchen tickets | `KitchenPrinter.print`, the bridge | Sent to the station's printer only; never logged                         |
| Receipt ids     | `UsedReceiptStore.claim`           | Ids only, never the token or the basket                                  |
| Display views   | `CustomerDisplay.show`             | Posted to the app's own display window only (same-origin channel)        |
