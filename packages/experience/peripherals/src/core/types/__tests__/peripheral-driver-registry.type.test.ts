/**
 * Stackra file contract:
 * Purpose: type tests of the `DriverRegistry` entries: `DriverName<Port>` of the three selectable ports narrows to
 *          exactly this package's driver names, the unions the template's generated desktop wiring declares.
 * Boundary: test only; type assertions, checked by the typecheck of the testing workflow.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 4 and 19); ADR 0263 (decision 9).
 */
import "#core/types/peripheral-driver-registry.type";
import type { DriverName } from "@stackra/container";
import { describe, expectTypeOf, it } from "@stackra/testing";

import type { BarcodeScanner } from "#contracts/ports/barcode-scanner.port";
import type { CardTerminal } from "#contracts/ports/card-terminal.port";
import type { CashDrawer } from "#contracts/ports/cash-drawer.port";
import type { CustomerDisplay } from "#contracts/ports/customer-display.port";
import type { LabelPrinter } from "#contracts/ports/label-printer.port";
import type { ReceiptPrinter } from "#contracts/ports/receipt-printer.port";

describe("peripherals DriverRegistry entries", () => {
  it("narrows each port to its own drivers", () => {
    expectTypeOf<DriverName<ReceiptPrinter>>().toEqualTypeOf<"escpos" | "memory">();
    expectTypeOf<DriverName<CashDrawer>>().toEqualTypeOf<"printer_kick" | "memory">();
    expectTypeOf<DriverName<BarcodeScanner>>().toEqualTypeOf<"hid" | "memory">();
    expectTypeOf<DriverName<LabelPrinter>>().toEqualTypeOf<"zpl" | "memory">();
    expectTypeOf<DriverName<CustomerDisplay>>().toEqualTypeOf<"channel" | "external" | "memory">();
    expectTypeOf<DriverName<CardTerminal>>().toEqualTypeOf<"memory">();
  });
});
