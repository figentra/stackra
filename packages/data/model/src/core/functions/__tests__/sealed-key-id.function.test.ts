/**
 * Stackra file contract:
 * Purpose: unit tests of `sealedKeyId`: the key id of a value in the `aes-gcm` sealed form, and undefined for anything
 *          else.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); gap gov7 (stackra-312).
 */
import { describe, expect, it } from "@stackra/testing";

import { sealedKeyId } from "#core/functions/sealed-key-id.function";

describe(sealedKeyId, () => {
  it("reads the key id of a sealed value", () => {
    expect(sealedKeyId("v1.k2.qL0.Zm9v")).toBe("k2");
  });

  it.each(["", "plain text", "v2.k2.qL0.Zm9v", "v1..qL0.Zm9v", "v1.k2.qL0", "v1.k2.qL0.Zm9v.x"])(
    "answers undefined for %j",
    (value) => {
      expect(sealedKeyId(value)).toBeUndefined();
    },
  );
});
