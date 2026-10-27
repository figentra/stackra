/**
 * Stackra file contract:
 * Purpose: `refusalMismatches(error, expect)`, what a recorded case reports when the gateway threw: nothing when the
 *          refusal is the one recorded (a lost answer as `provider_unavailable`, or the `refused` code), else the miss.
 * Boundary: internal to the `./testing` case runners, not exported from the entry. A thrown error that is not a
 *           refusal is a gateway bug and is rethrown.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 6: a lost answer is `ProviderUnavailableError`); ADR 0308 (rule 13).
 */
import { isRefusal } from "@stackra/errors";
import { ProviderUnavailableError } from "@stackra/integrations";

/**
 * The misses of a thrown `error` against what was recorded.
 *
 * @throws `error` itself when it is not a refusal.
 * @example
 * return { caseId, answer: null, mismatches: refusalMismatches(error, certification.expect) };
 */
export function refusalMismatches(
  error: unknown,
  expect: { readonly lost?: boolean; readonly refused?: string },
): string[] {
  if (!isRefusal(error)) throw error;
  const lost = isRefusal(error, ProviderUnavailableError);
  if (lost ? expect.lost === true : expect.refused === error.code) return [];
  return [`refused: ${error.code}${lost ? " (no outage was recorded)" : ""}`];
}
