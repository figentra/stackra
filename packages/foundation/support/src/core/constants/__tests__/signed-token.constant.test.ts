/**
 * Stackra file contract:
 * Purpose: unit tests of `signedToken`: a round trip carries the data and key id, a rotated key still verifies by id,
 *          and a tampered, foreign-key, wrong-purpose, expired, unknown-key or malformed token is refused.
 * Boundary: test only; keys are fixed in-memory bytes shaped like a `KeyProvider`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; STA-934.
 */
import { describe, expect, it } from "@stackra/testing";

import { signedToken } from "#core/constants/signed-token.constant";
import type { SigningKeySource } from "#core/types/signing-key-source.type";

function source(current: string, ...known: string[]): SigningKeySource {
  const keys = new Map(
    [current, ...known].map((id) => [id, { id, key: new TextEncoder().encode(`secret-${id}`) }]),
  );
  return {
    byId: async (id) => {
      const key = keys.get(id);
      if (!key) throw new Error("no key");
      return key;
    },
    current: async () => ({ id: current, key: keys.get(current)?.key ?? new Uint8Array() }),
  };
}

const now = new Date("2026-10-27T10:00:00Z");
const expiresAt = new Date("2026-10-27T11:00:00Z");

describe("signedToken", () => {
  it("round-trips the data and the key id", async () => {
    const keys = source("k1");
    const token = await signedToken.sign(keys, {
      purpose: "receipt.view",
      expiresAt,
      data: { id: "r_1" },
    });
    expect(token.split(".")).toHaveLength(3);
    await expect(
      signedToken.verify(keys, token, { purpose: "receipt.view", now }),
    ).resolves.toEqual({
      ok: true,
      data: { id: "r_1" },
      keyId: "k1",
      expiresAt,
    });
  });

  it("verifies a token signed before a rotation", async () => {
    const token = await signedToken.sign(source("old"), { purpose: "gate", expiresAt });
    const check = await signedToken.verify(source("new", "old"), token, { purpose: "gate", now });
    expect(check).toMatchObject({ ok: true, keyId: "old", data: null });
  });

  it("refuses a bad token with one reason", async () => {
    const keys = source("k1");
    const token = await signedToken.sign(keys, { purpose: "gate", expiresAt, data: 1 });
    const [k, body] = token.split(".");
    const verify = (t: string, purpose = "gate", at = now) =>
      signedToken.verify(keys, t, { purpose, now: at }).then((c) => (c.ok ? "ok" : c.reason));

    expect(await verify(`${k}.${body}.${"A".repeat(43)}`)).toBe("bad_signature");
    expect(await verify(token, "receipt.view")).toBe("wrong_purpose");
    expect(await verify(token, "gate", expiresAt)).toBe("expired");
    expect(await verify("a.b")).toBe("malformed");
    expect(await verify("!!.b.c")).toBe("malformed");
    const foreign = await signedToken.sign(source("k2"), { purpose: "gate", expiresAt });
    expect(await verify(foreign)).toBe("unknown_key");
  });

  it("refuses a token signed by another key under the same id", async () => {
    const forged: SigningKeySource = {
      current: async () => ({ id: "k1", key: new TextEncoder().encode("attacker") }),
      byId: async () => ({ id: "k1", key: new TextEncoder().encode("attacker") }),
    };
    const token = await signedToken.sign(forged, { purpose: "gate", expiresAt });
    await expect(
      signedToken.verify(source("k1"), token, { purpose: "gate", now }),
    ).resolves.toEqual({
      ok: false,
      reason: "bad_signature",
    });
  });

  it("refuses an empty purpose and an invalid expiry when signing", async () => {
    await expect(signedToken.sign(source("k1"), { purpose: "", expiresAt })).rejects.toThrow(
      RangeError,
    );
    await expect(
      signedToken.sign(source("k1"), { purpose: "gate", expiresAt: new Date(Number.NaN) }),
    ).rejects.toThrow(RangeError);
  });
});
