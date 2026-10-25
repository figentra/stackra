/**
 * Stackra file contract:
 * Purpose: unit tests of `WebCryptoPayloadSealDriver`: a sealed payload opens with the session's key and reveals
 *          nothing without it, the key is minted once into `secrets`, a wipe of `secrets` makes every earlier payload
 *          unopenable and the next seal mints a new key, and a tampered or foreign text opens to `undefined`.
 * Boundary: test only; storage is the real memory driver and the cipher is the runtime's `crypto.subtle`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0338 (decision 2 and its enforcement: unreadable without the secrets key).
 */
import { describe, expect, it } from "@stackra/testing";

import { PayloadSeal } from "#contracts/ports/payload-seal.port";
import { PAYLOAD_KEY } from "#core/constants/payload-key.constant";
import { MemoryStorageDriver } from "#core/drivers/memory-storage.driver";
import { WebCryptoPayloadSealDriver } from "#core/drivers/web-crypto-payload-seal.driver";

const PAYLOAD = JSON.stringify({
  items: [{ action: "orders.order.create@1", input: { total: 3 } }],
});

describe("WebCryptoPayloadSealDriver", () => {
  it("is an encrypting PayloadSeal whose payload opens with the session key", async () => {
    const storage = new MemoryStorageDriver();
    const seal = new WebCryptoPayloadSealDriver(storage);
    expect(seal).toBeInstanceOf(PayloadSeal);
    expect(seal.isEncrypting).toBe(true);
    const sealed = await seal.seal(PAYLOAD);
    expect(sealed).toMatch(/^v1\.[A-Za-z0-9+/=]+\.[A-Za-z0-9+/=]+$/);
    expect(sealed).not.toContain("orders.order.create");
    expect(await seal.open(sealed)).toBe(PAYLOAD);
  });

  it("mints the key once into secrets and uses a fresh nonce per seal", async () => {
    const storage = new MemoryStorageDriver();
    const seal = new WebCryptoPayloadSealDriver(storage);
    const first = await seal.seal(PAYLOAD);
    const key = storage.secrets.get(PAYLOAD_KEY);
    expect(typeof key).toBe("string");
    const second = await seal.seal(PAYLOAD);
    expect(storage.secrets.get(PAYLOAD_KEY)).toBe(key);
    expect(second).not.toBe(first);
    expect(await new WebCryptoPayloadSealDriver(storage).open(first)).toBe(PAYLOAD);
  });

  it("cannot open anything once secrets is wiped, and the next seal mints a new key", async () => {
    const storage = new MemoryStorageDriver();
    const seal = new WebCryptoPayloadSealDriver(storage);
    const sealed = await seal.seal(PAYLOAD);
    const key = storage.secrets.get(PAYLOAD_KEY);
    storage.secrets.clear();
    expect(await seal.open(sealed)).toBeUndefined();
    const fresh = await seal.seal(PAYLOAD);
    expect(storage.secrets.get(PAYLOAD_KEY)).not.toBe(key);
    expect(await seal.open(sealed)).toBeUndefined();
    expect(await seal.open(fresh)).toBe(PAYLOAD);
  });

  it("opens a tampered, foreign or plain text to undefined", async () => {
    const storage = new MemoryStorageDriver();
    const seal = new WebCryptoPayloadSealDriver(storage);
    const sealed = await seal.seal(PAYLOAD);
    const [version, nonce, data = ""] = sealed.split(".");
    const flipped = `${data.startsWith("A") ? "B" : "A"}${data.slice(1)}`;
    expect(await seal.open(`${version}.${nonce}.${flipped}`)).toBeUndefined();
    expect(
      await seal.open(await new WebCryptoPayloadSealDriver(new MemoryStorageDriver()).seal("x")),
    ).toBeUndefined();
    expect(await seal.open(PAYLOAD)).toBeUndefined();
    expect(await seal.open(`${sealed}.extra`)).toBeUndefined();
  });
});
