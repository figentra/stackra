/**
 * Stackra file contract:
 * Purpose: unit tests of `columnResolver`: a scalar and an embedded path resolve to quoted columns of `row`, a to-one
 *          relation is joined once and reused, and a to-many relation, an unknown path or a multi-column field throws.
 * Boundary: test only; the metadata is a hand-written stand-in of the generated ORM metadata.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0160; ADR 0470 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { columnResolver } from "#node/functions/column-resolver.function";
import type { SourceMeta } from "#node/types/source-meta.type";

const customer: SourceMeta = {
  className: "Customer",
  primaryKeys: ["id"],
  properties: { country: { kind: "scalar", fieldNames: ["country"] } },
};

const meta: SourceMeta = {
  className: "Order",
  primaryKeys: ["id"],
  properties: {
    status: { kind: "scalar", fieldNames: ["status"] },
    total: {
      kind: "embedded",
      embeddedProps: {
        minor: { fieldNames: ["total_minor"] },
        currency: { fieldNames: ["total_currency"] },
      },
    },
    customer: { kind: "m:1", fieldNames: ["customer_id"], targetMeta: customer },
    lines: { kind: "1:m", targetMeta: customer },
    pair: { kind: "scalar", fieldNames: ["a", "b"] },
  },
};

describe(columnResolver, () => {
  it("resolves scalar, embedded and joined paths", () => {
    const join = vi.fn();
    const column = columnResolver(meta, join);
    expect(column("status")).toBe('row."status"');
    expect(column("total.minor")).toBe('row."total_minor"');
    expect(column("customer.country")).toBe('j0."country"');
    expect(column("customer.country")).toBe('j0."country"');
    expect(join).toHaveBeenCalledOnce();
    expect(join).toHaveBeenCalledWith("row.customer", "j0");
  });

  it("refuses a to-many relation, an unknown path and a multi-column field", () => {
    const column = columnResolver(meta, vi.fn());
    expect(() => column("lines.country")).toThrow(/to-many/);
    expect(() => column("missing")).toThrow(TypeError);
    expect(() => column("pair")).toThrow(TypeError);
  });
});
