/**
 * Stackra file contract:
 * Purpose: unit tests of `FiscalSigningKeyFake`: it is a `FiscalSigningKey`, signs deterministically per unit and
 *          message, and answers the sample facts or none.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { FiscalSigningKey } from "#contracts/ports/fiscal-signing-key.port";
import { FiscalSigningKeyFake } from "#testing/fiscal-signing-key.fake";

describe("FiscalSigningKeyFake", () => {
  it("signs deterministically and answers the certificate facts", async () => {
    const key = new FiscalSigningKeyFake();
    const message = new Uint8Array([1, 2, 3]);
    const first = await key.sign("u", message);
    expect(key).toBeInstanceOf(FiscalSigningKey);
    expect(await key.sign("u", message)).toBe(first);
    expect(await key.sign("v", message)).not.toBe(first);
    expect((await key.certificate("u"))?.serialNumber).toBe("1234567890");
    expect(key.calls("sign")).toHaveLength(3);
    expect(await new FiscalSigningKeyFake(null).certificate("u")).toBeNull();
  });
});
