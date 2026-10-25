/**
 * Stackra file contract:
 * Purpose: unit and type tests of `PeripheralsOptions`: a shape whose initializers equal the shipped schema's
 *          defaults, with each driver field typed as its port's driver names.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 4, 19 and 26).
 */
import type { DriverName } from "@stackra/container";
import type { Duration } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { Schema } from "@stackra/validation";

import type { BarcodeScanner } from "#contracts/ports/barcode-scanner.port";
import type { CardTerminal } from "#contracts/ports/card-terminal.port";
import type { CashDrawer } from "#contracts/ports/cash-drawer.port";
import type { CustomerDisplay } from "#contracts/ports/customer-display.port";
import type { LabelPrinter } from "#contracts/ports/label-printer.port";
import type { ReceiptPrinter } from "#contracts/ports/receipt-printer.port";
import type { DrawerPin } from "#contracts/types/drawer-pin.type";
import { PERIPHERALS_CONFIG_SCHEMA } from "#core/constants/peripherals-config-schema.constant";
import { PeripheralsOptions } from "#core/schemas/peripherals-options.schema";

describe("PeripheralsOptions", () => {
  it("is a shape whose defaults equal the shipped schema's", () => {
    const options = new PeripheralsOptions();
    expect(options).toBeInstanceOf(Schema);
    expect({ ...options }).toEqual(PERIPHERALS_CONFIG_SCHEMA.parse({}));
  });

  it("types each field", () => {
    expectTypeOf<PeripheralsOptions["printer"]>().toEqualTypeOf<DriverName<ReceiptPrinter>>();
    expectTypeOf<PeripheralsOptions["drawer"]>().toEqualTypeOf<DriverName<CashDrawer>>();
    expectTypeOf<PeripheralsOptions["scanner"]>().toEqualTypeOf<DriverName<BarcodeScanner>>();
    expectTypeOf<PeripheralsOptions["labelPrinter"]>().toEqualTypeOf<DriverName<LabelPrinter>>();
    expectTypeOf<PeripheralsOptions["customerDisplay"]>().toEqualTypeOf<
      DriverName<CustomerDisplay>
    >();
    expectTypeOf<PeripheralsOptions["cardTerminal"]>().toEqualTypeOf<DriverName<CardTerminal>>();
    expectTypeOf<PeripheralsOptions["drawerPin"]>().toEqualTypeOf<DrawerPin>();
    expectTypeOf<PeripheralsOptions["scanKeyGap"]>().toEqualTypeOf<Duration>();
  });
});
