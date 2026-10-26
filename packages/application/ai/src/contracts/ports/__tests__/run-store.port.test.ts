/**
 * Stackra file contract:
 * Purpose: unit tests of the `RunStore` port: an abstract port class a driver extends, never constructed bare.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0100 (decision 10); STA-781.
 */
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { RunStore } from "#contracts/ports/run-store.port";

describe("RunStore", () => {
  it("is a port", () => {
    expect(Object.getPrototypeOf(RunStore)).toBe(Port);
    expect(RunStore.name).toBe("RunStore");
  });
});
