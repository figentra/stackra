/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryRestrictedTenderProgramsDriver`: a program offered in one Market is found there only,
 *          and a later offer with the same code replaces it.
 * Boundary: test only; pure in-memory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0266; ADR 0445.
 */
import { describe, expect, it } from "@stackra/testing";

import { MemoryRestrictedTenderProgramsDriver } from "#core/drivers/memory-restricted-tender-programs.driver";

const snap = {
  code: "snap",
  ruleSet: "rs",
  taxExempt: true,
  captureAtFulfilment: true,
  pinEntry: true,
};

describe("MemoryRestrictedTenderProgramsDriver", () => {
  it("answers per Market and replaces by code", async () => {
    const programs = new MemoryRestrictedTenderProgramsDriver().offer("xa", snap);
    expect(await programs.program("xa", "snap")).toEqual(snap);
    expect(await programs.program("xb", "snap")).toBeUndefined();
    programs.offer("xa", { ...snap, pinEntry: false });
    expect((await programs.program("xa", "snap"))?.pinEntry).toBe(false);
  });
});
