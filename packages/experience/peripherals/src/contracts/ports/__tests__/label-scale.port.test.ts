/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `LabelScale` port: a port base keyed `peripherals.LabelScale` whose drivers are
 *          instances of it, with its probe, sync and remove signatures and the item shape.
 * Boundary: test only; the driver is the package's memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0253; ADR 0294 (decision 16); STA-965.
 */
import { Port } from "@stackra/contracts";
import type { CapabilityResult } from "@stackra/platform/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { LabelScale } from "#contracts/ports/label-scale.port";
import type { LabelScaleItem } from "#contracts/types/label-scale-item.type";
import { MemoryLabelScaleDriver } from "#core/drivers/memory-label-scale.driver";

describe("LabelScale", () => {
  it("is a port its drivers are instances of", () => {
    const scales = new MemoryLabelScaleDriver();
    expect(scales).toBeInstanceOf(LabelScale);
    expect(scales).toBeInstanceOf(Port);
  });

  it("is keyed peripherals.LabelScale and types its calls", () => {
    expectTypeOf<LabelScale["~key"]>().toEqualTypeOf<"peripherals.LabelScale">();
    expectTypeOf<LabelScale["probe"]>().parameters.toEqualTypeOf<[scale: string]>();
    expectTypeOf<LabelScale["sync"]>().returns.toEqualTypeOf<
      Promise<CapabilityResult<readonly string[]>>
    >();
    expectTypeOf<LabelScale["remove"]>().returns.toEqualTypeOf<Promise<CapabilityResult>>();
    expectTypeOf<LabelScaleItem>().toEqualTypeOf<{
      readonly itemCode: string;
      readonly name: string;
      readonly price: string;
      readonly currency: string;
      readonly byWeight: boolean;
      readonly tareGrams: number;
      readonly effectiveAt: string | null;
    }>();
  });
});
