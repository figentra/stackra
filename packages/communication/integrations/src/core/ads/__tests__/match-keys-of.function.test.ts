/**
 * Stackra file contract:
 * Purpose: unit tests of `matchKeysOf`: the email is trimmed and lowercased before hashing, the phone is hashed with or
 *          without its `+` as the format says, blanks are left out and a person with nothing to match by is refused.
 * Boundary: test only; the expected digests are computed with `node:crypto`, independently of Web Crypto.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0134 (personal data); STA-793.
 */
import { createHash } from "node:crypto";

import { describe, expect, it } from "@stackra/testing";

import { matchKeysOf } from "#core/ads/match-keys-of.function";

/** Hex SHA-256 of `text`. */
const sha256 = (text: string): string => createHash("sha256").update(text).digest("hex");

describe(matchKeysOf, () => {
  it("normalises the email and hashes the phone as E.164", async () => {
    await expect(
      matchKeysOf(
        { email: "  Buyer@Shop.Example ", phone: "+966 50 000 0000", externalId: "cus_1" },
        { phone: "e164" },
      ),
    ).resolves.toEqual({
      email: sha256("buyer@shop.example"),
      phone: sha256("+966500000000"),
      externalId: sha256("cus_1"),
    });
  });

  it("hashes the phone's digits only when the platform asks", async () => {
    await expect(matchKeysOf({ phone: "+966500000000" }, { phone: "digits" })).resolves.toEqual({
      phone: sha256("966500000000"),
    });
  });

  it("leaves blanks out and refuses a person with nothing to match by", async () => {
    await expect(matchKeysOf({ email: " ", externalId: "c" }, { phone: "e164" })).resolves.toEqual({
      externalId: sha256("c"),
    });
    await expect(matchKeysOf({ email: "" }, { phone: "e164" })).rejects.toThrow(TypeError);
  });
});
