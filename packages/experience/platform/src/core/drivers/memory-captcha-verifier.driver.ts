/**
 * Stackra file contract:
 * Purpose: `MemoryCaptchaVerifierDriver`, the `CaptchaVerifier` driver with no provider: the `memory` candidate of
 *          tests and local runs, where a form must work without a captcha secret.
 * Boundary: no network. It accepts every non-empty token while `accepts` is true; a test sets `accepts = false` to
 *           take the refusal path. `verified` lists the tokens it was asked about.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (memory drivers first); ADR 0269 (fakes are real drivers).
 */
import { Driver } from "@stackra/container";

import { CaptchaVerifier } from "#contracts/ports/captcha-verifier.port";

/**
 * A captcha check in memory.
 *
 * @example
 * const captcha = new MemoryCaptchaVerifierDriver();
 * captcha.accepts = false;
 * await captcha.verify("token"); // false
 */
export class MemoryCaptchaVerifierDriver extends Driver(CaptchaVerifier) {
  /** Whether non-empty tokens pass. */
  accepts = true;

  /** Every token asked about, in order. */
  readonly verified: string[] = [];

  /** True for a non-empty token while `accepts` holds. */
  async verify(token: string): Promise<boolean> {
    this.verified.push(token);
    return this.accepts && token.length > 0;
  }
}
