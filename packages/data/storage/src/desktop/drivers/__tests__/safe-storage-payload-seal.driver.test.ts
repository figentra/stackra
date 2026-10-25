/**
 * Stackra file contract:
 * Purpose: unit tests of `SafeStoragePayloadSealDriver`: a sealed payload opens in the same session, a wiped or new
 *          session cannot open it, malformed or foreign text opens to `undefined`, and sealing refuses without keychain
 *          encryption.
 * Boundary: test only; `electron`'s `safeStorage` is replaced by a reversible stand-in, and a memory storage holds the
 *           `secrets` area.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0338 (decision 2).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { PayloadSeal } from "#contracts/ports/payload-seal.port";
import { MemoryStorageDriver } from "#core/drivers/memory-storage.driver";
import { SafeStoragePayloadSealDriver } from "#desktop/drivers/safe-storage-payload-seal.driver";

const keychain = vi.hoisted(() => ({ available: true }));

vi.mock("electron", () => ({
  safeStorage: {
    isEncryptionAvailable: () => keychain.available,
    encryptString: (text: string) => Buffer.from(`k:${text}`, "utf8"),
    decryptString: (data: Buffer) => {
      const text = data.toString("utf8");
      if (!text.startsWith("k:")) throw new Error("Error while decrypting the ciphertext");
      return text.slice(2);
    },
  },
}));

afterEach(() => {
  keychain.available = true;
});

describe("SafeStoragePayloadSealDriver", () => {
  it("is an encrypting PayloadSeal that opens its own session's payloads", async () => {
    const storage = new MemoryStorageDriver();
    const seal = new SafeStoragePayloadSealDriver(storage);
    expect(seal).toBeInstanceOf(PayloadSeal);
    expect(seal.isEncrypting).toBe(true);
    const sealed = await seal.seal('{"queue":[1]}');
    expect(sealed.startsWith("ss1.")).toBe(true);
    expect(await seal.open(sealed)).toBe('{"queue":[1]}');
  });

  it("cannot open a payload once the session was wiped or replaced", async () => {
    const storage = new MemoryStorageDriver();
    const seal = new SafeStoragePayloadSealDriver(storage);
    const sealed = await seal.seal("payload");
    storage.secrets.clear();
    expect(await seal.open(sealed)).toBeUndefined();
    await seal.seal("new session");
    expect(await seal.open(sealed)).toBeUndefined();
  });

  it("opens malformed or foreign text to undefined", async () => {
    const seal = new SafeStoragePayloadSealDriver(new MemoryStorageDriver());
    await seal.seal("x");
    for (const text of [
      "",
      "v1.a.b",
      "ss1",
      "ss1.a.b",
      `ss1.${Buffer.from("other").toString("base64")}`,
    ])
      expect(await seal.open(text), text).toBeUndefined();
  });

  it("refuses to seal without keychain encryption", async () => {
    keychain.available = false;
    await expect(
      new SafeStoragePayloadSealDriver(new MemoryStorageDriver()).seal("x"),
    ).rejects.toThrow(/keychain/);
  });
});
