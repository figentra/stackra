/**
 * Stackra file contract:
 * Purpose: unit tests of the `PageReader` port: an abstract port class a driver extends, never constructed bare.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0450 (decision 1).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { PageReader } from "#contracts/ports/page-reader.port";

describe("PageReader", () => {
  it("is a port", () => {
    expect(Object.getPrototypeOf(PageReader)).toBe(Port);
    expect(PageReader.name).toBe("PageReader");
  });
});
