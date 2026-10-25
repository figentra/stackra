/**
 * Stackra file contract:
 * Purpose: unit tests of the `FieldCipher` port: a `Port` whose sealed form opens back to the plain text only for the
 *          context it was sealed for.
 * Boundary: test only; the implementation is a reversible stand-in, not a cipher.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 16).
 */
import { describe, expect, it } from "@stackra/testing";

import { Port } from "#core/bases/port.base";
import { FieldCipher } from "#core/ports/field-cipher.port";

/** Seals as `k1.<context>.<plain reversed>`: the key id is in the sealed form, as the port requires. */
class ReversingCipher extends FieldCipher {
  override async seal(plain: string, context: string): Promise<string> {
    return `k1.${context}.${[...plain].reverse().join("")}`;
  }

  override async open(sealed: string, context: string): Promise<string> {
    const [keyId, sealedContext, ...rest] = sealed.split(".");
    if (keyId !== "k1" || sealedContext !== context) throw new Error("Cannot open");
    return [...rest.join(".")].reverse().join("");
  }
}

describe("FieldCipher", () => {
  it("is a port an implementation extends", () => {
    expect(new ReversingCipher()).toBeInstanceOf(FieldCipher);
    expect(Object.getPrototypeOf(FieldCipher)).toBe(Port);
  });

  it("opens what it sealed, in the same context only", async () => {
    const cipher: FieldCipher = new ReversingCipher();
    const sealed = await cipher.seal("secret", "user.email");
    expect(sealed).not.toContain("secret");
    expect(sealed.startsWith("k1.")).toBe(true);
    expect(await cipher.open(sealed, "user.email")).toBe("secret");
    await expect(cipher.open(sealed, "user.phone")).rejects.toThrow("Cannot open");
  });
});
