/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryCaptchaVerifierDriver`: non-empty tokens pass while `accepts` holds, an empty one
 *          never does, and every token asked about is recorded.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";

import { CaptchaVerifier } from "#contracts/ports/captcha-verifier.port";
import { MemoryCaptchaVerifierDriver } from "#core/drivers/memory-captcha-verifier.driver";

describe("MemoryCaptchaVerifierDriver", () => {
  it("accepts non-empty tokens until told otherwise", async () => {
    const captcha = new MemoryCaptchaVerifierDriver();
    expect(captcha).toBeInstanceOf(CaptchaVerifier);
    expect(await captcha.verify("token")).toBe(true);
    expect(await captcha.verify("")).toBe(false);
    captcha.accepts = false;
    expect(await captcha.verify("token")).toBe(false);
    expect(captcha.verified).toEqual(["token", "", "token"]);
  });
});
