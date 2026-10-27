/**
 * Stackra file contract:
 * Purpose: unit tests of `MemorySubjectSaltStoreDriver`: destroying a held salt answers true once, then false.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0212 (crypto-shredding); STA-1375.
 */
import { describe, expect, it } from "@stackra/testing";

import { SubjectSaltStore } from "#contracts/ports/subject-salt-store.port";
import { MemorySubjectSaltStoreDriver } from "#core/drivers/memory-subject-salt-store.driver";

describe("MemorySubjectSaltStoreDriver", () => {
  it("destroys a held salt once", async () => {
    const salts = new MemorySubjectSaltStoreDriver(["usr_1"]);
    expect(salts).toBeInstanceOf(SubjectSaltStore);
    await expect(salts.destroy("usr_1")).resolves.toBe(true);
    expect(salts.has("usr_1")).toBe(false);
    await expect(salts.destroy("usr_1")).resolves.toBe(false);
  });
});
