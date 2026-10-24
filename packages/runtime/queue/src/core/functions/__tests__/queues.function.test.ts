/**
 * Stackra file contract:
 * Purpose: unit tests of `queues`: the generated `Queues` of the template (`Queues.Maintenance`, `Queues.Delivery`), a
 *          snake_case name as a PascalCase case, the value as an `Enum.of` enum, and the refusal of a bad or repeated
 *          name.
 * Boundary: test only; the calls are the ones the template's committed `#stackra/queues` samples make.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0305 (rule 28: the job's queue is typed).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { queues } from "#core/functions/queues.function";

describe(queues, () => {
  it("builds the template's queue enums", () => {
    const Queues = queues(["default", "maintenance", "notifications"] as const);
    expect(Queues.Default).toBe("default");
    expect(Queues.Maintenance).toBe("maintenance");
    expect(Queues.Notifications).toBe("notifications");
    expect(queues(["delivery", "inbox"] as const).Delivery).toBe("delivery");
  });

  it("names a snake_case queue in PascalCase and types each code", () => {
    const Queues = queues(["bulk_import", "default"] as const);
    expect(Queues.BulkImport).toBe("bulk_import");
    expectTypeOf(Queues.BulkImport).toEqualTypeOf<"bulk_import">();
    expectTypeOf<Enum.Value<typeof Queues>>().toEqualTypeOf<"bulk_import" | "default">();
  });

  it("is an enum in list order", () => {
    expect(Enum.values(queues(["maintenance", "default"] as const))).toEqual([
      "maintenance",
      "default",
    ]);
  });

  it("refuses a name that is not snake_case, and a name listed twice", () => {
    expect(() => queues(["Bulk-Import"])).toThrow(TypeError);
    expect(() => queues([""])).toThrow(TypeError);
    expect(() => queues(["default", "default"])).toThrow(RangeError);
  });
});
