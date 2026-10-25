/**
 * Stackra file contract:
 * Purpose: `isLostAnswer`, whether a provider call failed in a way that leaves its result unknown: no answer, a
 *          timeout, or retries spent on server errors (`ProviderUnavailableError` from the managed client).
 * Boundary: a provider's 4xx (`ProviderRefusedError`) is a clear refusal, not a lost answer; nor is any other error.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 6); ADR 0308 (rule 13: the managed client's refusals).
 */
import { isRefusal } from "@stackra/errors";
import { ProviderUnavailableError } from "@stackra/integrations";

/**
 * True when the provider may or may not have acted.
 *
 * @example
 * catch (error) { if (isLostAnswer(error)) await markUnknown(record); throw error; }
 */
export function isLostAnswer(error: unknown): boolean {
  return isRefusal(error, ProviderUnavailableError);
}
