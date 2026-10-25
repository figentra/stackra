/**
 * Stackra file contract:
 * Purpose: `ClientRefusal`, the kind factory form of `refusalRef` that a public-area generated client uses
 *          (`class RateLimitedError extends ClientRefusal({ code: "leads.rate_limited", message }) {}`), with the code
 *          inside the options.
 * Boundary: the same refusal class as `refusalRef`; kept until gen writes one form in every target (STA-339).
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope); ADR 0305 (kind factories take no `define` prefix).
 */
import { refusalRef } from "#core/functions/refusal-ref.function";
import type { ClientRefusalOptions } from "#core/types/client-refusal-options.type";
import type { RefusalRef } from "#core/types/refusal-ref.type";

// shortcut: a second spelling of refusalRef because two gen revisions emit both; drop one once gen settles (STA-339).
/**
 * A consumed refusal class.
 *
 * @throws RangeError when `code` is not a snake_case refusal code.
 * @example
 * export class CaptchaFailedError extends ClientRefusal({
 *   code: "leads.captcha_failed",
 *   message: I18n.leads.refusals.captcha_failed,
 * }) {}
 */
export function ClientRefusal(options: ClientRefusalOptions): RefusalRef {
  const { code, ...rest } = options;
  return refusalRef(code, rest);
}
