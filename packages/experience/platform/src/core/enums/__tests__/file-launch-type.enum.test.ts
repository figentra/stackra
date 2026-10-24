/**
 * Stackra file contract:
 * Purpose: unit tests of `FileLaunchType`: its codes in source order, a case read by name, and the type of one code.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 16: the Enum row).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { FileLaunchType } from "#core/enums/file-launch-type.enum";

describe("FileLaunchType", () => {
  it("lists its codes in source order", () => {
    expect(Enum.values(FileLaunchType)).toEqual(["single-client", "multiple-clients"]);
  });

  it("reads a case by name and types it as a code", () => {
    expect(FileLaunchType.SingleClient).toBe("single-client");
    expectTypeOf(FileLaunchType.SingleClient).toEqualTypeOf<"single-client">();
    expectTypeOf<FileLaunchType>().toEqualTypeOf<"single-client" | "multiple-clients">();
  });

  it("is frozen", () => {
    expect(Object.isFrozen(FileLaunchType)).toBe(true);
  });
});
