/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `CaptchaVerifier` port: a port base keyed `platform.CaptchaVerifier` whose
 *          drivers are instances of it, answering a token with a yes or no.
 * Boundary: test only; the driver is the package's memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 16).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { CaptchaVerifier } from "#contracts/ports/captcha-verifier.port";
import { MemoryCaptchaVerifierDriver } from "#core/drivers/memory-captcha-verifier.driver";

describe("CaptchaVerifier", () => {
  it("is a port its drivers are instances of", () => {
    const captcha = new MemoryCaptchaVerifierDriver();
    expect(captcha).toBeInstanceOf(CaptchaVerifier);
    expect(captcha).toBeInstanceOf(Port);
  });

  it("is keyed platform.CaptchaVerifier and answers a boolean", () => {
    expectTypeOf<CaptchaVerifier["~key"]>().toEqualTypeOf<"platform.CaptchaVerifier">();
    expectTypeOf<CaptchaVerifier["verify"]>().toEqualTypeOf<
      (token: string, remoteIp?: string) => Promise<boolean>
    >();
  });
});
