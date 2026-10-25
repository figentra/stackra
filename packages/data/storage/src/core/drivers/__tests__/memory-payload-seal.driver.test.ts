/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryPayloadSealDriver`: it reports no encryption, opens what it sealed under the current key
 *          id, and opens nothing once `secrets` is wiped or for text tagged with another key id.
 * Boundary: test only; storage is the real memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0338 (decision 2); ADR 0266.
 */
import { describe, expect, it } from "@stackra/testing";

import { PayloadSeal } from "#contracts/ports/payload-seal.port";
import { MemoryPayloadSealDriver } from "#core/drivers/memory-payload-seal.driver";
import { MemoryStorageDriver } from "#core/drivers/memory-storage.driver";

describe("MemoryPayloadSealDriver", () => {
  it("is a PayloadSeal that encrypts nothing and opens what it sealed", async () => {
    const seal = new MemoryPayloadSealDriver(new MemoryStorageDriver());
    expect(seal).toBeInstanceOf(PayloadSeal);
    expect(seal.isEncrypting).toBe(false);
    const sealed = await seal.seal('{"a":1}');
    expect(sealed).toMatch(/^m1\.[0-9a-f-]{36}\.\{"a":1\}$/);
    expect(await seal.open(sealed)).toBe('{"a":1}');
    expect((await seal.seal("b")).slice(0, 40)).toBe(sealed.slice(0, 40));
  });

  it("opens nothing once secrets is wiped or under another key id", async () => {
    const storage = new MemoryStorageDriver();
    const seal = new MemoryPayloadSealDriver(storage);
    const sealed = await seal.seal("payload");
    storage.secrets.clear();
    expect(await seal.open(sealed)).toBeUndefined();
    await seal.seal("next");
    expect(await seal.open(sealed)).toBeUndefined();
    expect(await seal.open("payload")).toBeUndefined();
  });
});
