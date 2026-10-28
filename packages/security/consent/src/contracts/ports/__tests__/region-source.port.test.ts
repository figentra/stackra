/**
 * Stackra file contract:
 * Purpose: type and shape tests of the `RegionSource` port: an abstract port class with one synchronous `regionOf`
 *          of request headers, and a driver of it is an instance of it.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 16 and 17).
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { RegionSource } from "#contracts/ports/region-source.port";

/** The smallest driver of the port. */
class FixedRegionSourceDriver extends Driver(RegionSource) {
  regionOf(headers: Headers): string | null {
    return headers.get("cf-ipcountry") ?? "SA";
  }
}

describe("RegionSource", () => {
  it("is a port, and its drivers are instances of it", () => {
    const source = new FixedRegionSourceDriver();
    expect(source).toBeInstanceOf(RegionSource);
    expect(source).toBeInstanceOf(Port);
    expect(source.regionOf(new Headers())).toBe("SA");
  });

  it("types regionOf as a synchronous read of headers", () => {
    expectTypeOf<RegionSource["regionOf"]>().parameters.toEqualTypeOf<[Headers]>();
    expectTypeOf<RegionSource["regionOf"]>().returns.toEqualTypeOf<string | null>();
  });
});
