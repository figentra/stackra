/**
 * Stackra file contract:
 * Purpose: the `CaptchaVerifier` port: the server-side check of a captcha token a public form sent (the contact
 *          form's Turnstile widget), so the action refuses a bot with its own typed error.
 * Boundary: an abstract class that is its own token, keyed `platform.CaptchaVerifier`. It answers yes or no; the
 *           refusal (`captcha_failed`) belongs to the action that asked. A transport failure throws, so it is never
 *           mistaken for a failed captcha.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 15, 16 and 17); ADR 0263 (ports resolve by type).
 */
import { Port } from "@stackra/contracts";

/**
 * Verifies captcha tokens.
 *
 * @example
 * if (!(await this.captcha.verify(input.captchaToken, ctx.remoteIp))) throw CaptchaFailedError.create();
 */
export abstract class CaptchaVerifier extends Port {
  /** Type-only port key, so `DriverName<CaptchaVerifier>` narrows to this port's drivers. */
  declare readonly "~key": "platform.CaptchaVerifier";

  /**
   * Whether `token` is a valid, unused captcha answer.
   *
   * @param remoteIp - the visitor's address, when the provider checks it.
   * @throws Error when the provider cannot be reached or answers with something other than a verdict.
   */
  abstract verify(token: string, remoteIp?: string): Promise<boolean>;
}
