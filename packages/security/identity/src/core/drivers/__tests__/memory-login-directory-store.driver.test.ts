/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryLoginDirectoryStoreDriver`: put and remove are idempotent and `keys()` lists what is
 *          written.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0451.
 */
import { describe, expect, it } from "@stackra/testing";

import { LoginDirectoryStore } from "#contracts/index";
import { MemoryLoginDirectoryStoreDriver } from "#core/drivers/memory-login-directory-store.driver";

describe("MemoryLoginDirectoryStoreDriver", () => {
  it("puts and removes keys idempotently", async () => {
    const directory = new MemoryLoginDirectoryStoreDriver();
    expect(directory).toBeInstanceOf(LoginDirectoryStore);
    await directory.put(["b", "a", "a"]);
    expect(directory.keys()).toEqual(["a", "b"]);
    await directory.remove(["a", "missing"]);
    expect(directory.keys()).toEqual(["b"]);
  });
});
