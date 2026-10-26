/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: it exports the four ports (the template's desktop wiring
 *          and console config import `BarcodeScanner`, `CashDrawer` and `ReceiptPrinter`) and the types their
 *          signatures name, nothing else.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias. Type exports are checked by type.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type { DrawerPin, PrintedReceipt, Receipt, ScaleReading } from "#contracts/index";

describe("@stackra/peripherals/contracts", () => {
  it("exports exactly the eight ports and two enums at run time", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "AccessController",
      "BarcodeScanner",
      "CardTerminal",
      "CashDrawer",
      "CustomerDisplay",
      "LabelFormat",
      "LabelPrinter",
      "ReceiptPrinter",
      "Scale",
      "TerminalState",
    ]);
  });

  it("types the receipt, the printed result, the pin and the reading", () => {
    expectTypeOf<Receipt>().toEqualTypeOf<{
      readonly orderId: string;
      readonly lines: readonly string[];
    }>();
    expectTypeOf<PrintedReceipt>().toEqualTypeOf<{
      readonly printer: string;
      readonly orderId: string;
    }>();
    expectTypeOf<DrawerPin>().toEqualTypeOf<2 | 5>();
    expectTypeOf<ScaleReading>().toEqualTypeOf<{
      readonly grams: number;
      readonly isStable: boolean;
    }>();
  });
});
