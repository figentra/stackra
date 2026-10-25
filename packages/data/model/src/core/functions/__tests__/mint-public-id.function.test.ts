/**
 * Stackra file contract:
 * Purpose: unit tests of `mintPublicId`: the ADR 0135 format, the UUIDv7 version and variant bits, time order across
 *          milliseconds, and determinism under `freezeClock` and `freezeIds`.
 * Boundary: test only; decodes the base32 body back to the 16 UUID bytes to check the bits.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0135 (decision 1); ADR 0269 (freeze helpers).
 */
import { describe, expect, freezeClock, freezeIds, it } from "@stackra/testing";

import { mintPublicId } from "#core/functions/mint-public-id.function";

const ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";

/** The 16 bytes a public id's body encodes. */
function bytesOf(id: string): number[] {
  let value = 0n;
  for (const char of id.slice(id.indexOf("_") + 1))
    value = (value << 5n) | BigInt(ALPHABET.indexOf(char));
  const bytes: number[] = [];
  for (let index = 0; index < 16; index++) {
    bytes.unshift(Number(value & 0xffn));
    value >>= 8n;
  }
  return bytes;
}

describe(mintPublicId, () => {
  it("writes the prefix and 26 lowercase Crockford base32 characters", () => {
    expect(mintPublicId("ord")).toMatch(/^ord_[0-9a-hjkmnp-tv-z]{26}$/);
  });

  it("encodes a UUIDv7 with the current milliseconds", () => {
    freezeClock("2026-10-24T09:00:00Z");
    const bytes = bytesOf(mintPublicId("ord"));
    const millis = bytes.slice(0, 6).reduce((sum, byte) => sum * 256 + byte, 0);
    expect(millis).toBe(Date.parse("2026-10-24T09:00:00Z"));
    expect((bytes[6] ?? 0) >> 4).toBe(7);
    expect((bytes[8] ?? 0) >> 6).toBe(2);
  });

  it("sorts by creation time", () => {
    freezeClock("2026-10-24T09:00:00Z");
    const earlier = mintPublicId("ord");
    freezeClock("2026-10-24T09:00:01Z");
    expect(mintPublicId("ord") > earlier).toBe(true);
  });

  it("is deterministic under frozen ids and clock", () => {
    freezeClock("2026-10-24T09:00:00Z");
    freezeIds();
    const first = mintPublicId("ord");
    freezeIds();
    expect(mintPublicId("ord")).toBe(first);
  });
});
