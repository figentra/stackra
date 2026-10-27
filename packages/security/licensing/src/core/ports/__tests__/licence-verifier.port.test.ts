/**
 * Stackra file contract:
 * Purpose: unit tests of the `LicenceVerifier` port: a driver is an instance of it and of `Port`, and its members are
 *          typed.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0178; ADR 0263.
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { LicenceVerifier } from "#core/ports/licence-verifier.port";
import type { Licence } from "#core/types/licence.type";
import type { LicenceKeyCheck } from "#core/types/licence-key-check.type";

/** A verifier that knows one key. */
class OneKeyVerifierDriver extends Driver(LicenceVerifier) {
  verify(): Promise<Licence> {
    return Promise.reject(new Error("no file"));
  }

  async check(licenceKey: string): Promise<LicenceKeyCheck> {
    const valid = licenceKey === "KEY-1";
    return { valid, code: valid ? "VALID" : "NOT_FOUND", detail: "" };
  }
}

describe("LicenceVerifier", () => {
  it("is a port, and its drivers are instances of it", async () => {
    const verifier = new OneKeyVerifierDriver();
    expect(verifier).toBeInstanceOf(LicenceVerifier);
    expect(verifier).toBeInstanceOf(Port);
    expect((await verifier.check("KEY-1")).valid).toBe(true);
  });

  it("types its members", () => {
    expectTypeOf<LicenceVerifier["verify"]>().returns.toEqualTypeOf<Promise<Licence>>();
    expectTypeOf<LicenceVerifier["check"]>().parameters.toEqualTypeOf<
      [string, (string | undefined)?]
    >();
  });
});
