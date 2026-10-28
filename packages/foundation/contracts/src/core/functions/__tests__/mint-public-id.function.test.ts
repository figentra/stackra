/**
 * Stackra file contract:
 * Purpose: unit tests of `mintPublicId`: the ADR 0135 format, the UUIDv7 version and variant bits, the time it
 *          encodes, minting order within one millisecond and after the clock steps back, and a random part that
 *          repeats under `freezeIds`.
 * Boundary: test only; decodes the base32 body back to the 16 UUID bytes to check the bits.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0135 (decision 1); ADR 0269 (freeze helpers); STA-1380.
 */
import { describe, expect, freezeClock, freezeIds, it } from "@stackra/testing";

import { mintPublicId } from "#core/functions/mint-public-id.function";

const ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";

/**
 * Far ahead of the real clock, so no earlier mint in this file is later. Every test mints later than the one before
 * (the frozen clock reads an hour after NOON), since the minter keeps the latest millisecond across tests.
 */
const NOON = Date.UTC(2099, 0, 1, 12);

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
    expect(mintPublicId("evt")).toMatch(/^evt_[0-9a-hjkmnp-tv-z]{26}$/);
  });

  it("encodes a UUIDv7 with the given milliseconds", () => {
    const bytes = bytesOf(mintPublicId("ord", NOON));
    expect(bytes.slice(0, 6).reduce((sum, byte) => sum * 256 + byte, 0)).toBe(NOON);
    expect((bytes[6] ?? 0) >> 4).toBe(7);
    expect((bytes[8] ?? 0) >> 6).toBe(2);
  });

  it("reads the clock when no time is given", () => {
    freezeClock("2099-01-01T13:00:00Z");
    const bytes = bytesOf(mintPublicId("ord"));
    expect(bytes.slice(0, 6).reduce((sum, byte) => sum * 256 + byte, 0)).toBe(
      Date.parse("2099-01-01T13:00:00Z"),
    );
  });

  it("sorts in minting order within one millisecond and when the clock steps back", () => {
    const later = NOON + 86_400_000;
    const ids = [
      mintPublicId("evt", later),
      mintPublicId("evt", later),
      mintPublicId("evt", later),
      mintPublicId("evt", later - 1000),
    ];
    expect(new Set(ids).size).toBe(4);
    expect([...ids].sort()).toEqual(ids);
    for (const id of ids) expect((bytesOf(id)[6] ?? 0) >> 4).toBe(7);
  });

  it("draws the same random part under frozen ids", () => {
    freezeIds();
    const first = bytesOf(mintPublicId("ord", NOON + 2 * 86_400_000));
    freezeIds();
    const second = bytesOf(mintPublicId("ord", NOON + 3 * 86_400_000));
    expect(second.slice(6)).toEqual(first.slice(6));
  });
});
