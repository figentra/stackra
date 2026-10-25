/**
 * Stackra file contract:
 * Purpose: unit tests of `Disposal`: its codes and their order are the contract the hold log stores.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0134 (2026-10-24 amendment); ADR 0022; ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";

import { Disposal } from "#contracts/enums/disposal.enum";

describe("Disposal", () => {
  it("names the three disposal paths", () => {
    expect([Disposal.Delete, Disposal.Purge, Disposal.Retention]).toEqual([
      "delete",
      "purge",
      "retention",
    ]);
  });
});
