/**
 * Stackra file contract:
 * Purpose: unit tests of `MemorySubjectSaltStoreDriver`: `obtain` creates a 32-byte salt once and hands out copies,
 *          `find` never creates one, and destroying a held salt answers true once, then false.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0212 (crypto-shredding); STA-1375; stackra-263.
 */
import { describe, expect, it } from "@stackra/testing";

import { SubjectSaltStore } from "#contracts/ports/subject-salt-store.port";
import { MemorySubjectSaltStoreDriver } from "#core/drivers/memory-subject-salt-store.driver";

describe("MemorySubjectSaltStoreDriver", () => {
  it("destroys a held salt once", async () => {
    const salts = new MemorySubjectSaltStoreDriver();
    salts.put(["usr_1"]);
    expect(salts).toBeInstanceOf(SubjectSaltStore);
    await expect(salts.destroy("usr_1")).resolves.toBe(true);
    expect(salts.has("usr_1")).toBe(false);
    await expect(salts.destroy("usr_1")).resolves.toBe(false);
  });

  it("creates a salt on the first obtain and keeps it", async () => {
    const salts = new MemorySubjectSaltStoreDriver();
    await expect(salts.find("usr_1")).resolves.toBeUndefined();
    const salt = await salts.obtain("usr_1");
    expect(salt).toHaveLength(32);
    expect(await salts.obtain("usr_1")).toEqual(salt);
    expect(await salts.find("usr_1")).toEqual(salt);
    salt.fill(0);
    expect(await salts.find("usr_1")).not.toEqual(salt);
  });

  it("finds nothing once the salt is destroyed", async () => {
    const salts = new MemorySubjectSaltStoreDriver();
    salts.put(["usr_1"]);
    await salts.destroy("usr_1");
    await expect(salts.find("usr_1")).resolves.toBeUndefined();
  });
});
