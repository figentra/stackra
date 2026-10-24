/**
 * Stackra file contract:
 * Purpose: `parseConsentRecord(value)`, how a store driver turns what it read (a decoded cookie, a storage value) into
 *          a `ConsentRecord`, or `null` when it is not one.
 * Boundary: internal; never throws, so an edited or stale cookie reads as no decision (decline by default) instead of
 *           breaking the page. Accepts a JSON string or an already parsed value.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decisions 1 and 3).
 */
import type { ConsentRecord } from "#contracts/types/consent-record.type";
import { CONSENT_RECORD_SCHEMA } from "#core/constants/consent-record-schema.constant";

/**
 * The record in `value`, or `null`.
 *
 * @param value - JSON text, or a value already parsed from JSON.
 * @example
 * parseConsentRecord('{"policyVersion":"1","decidedAt":"2026-10-24T09:00:00.000Z","categories":{}}');
 */
export function parseConsentRecord(value: unknown): ConsentRecord | null {
  let candidate = value;
  if (typeof value === "string") {
    try {
      candidate = JSON.parse(value);
    } catch {
      return null;
    }
  }
  const result = CONSENT_RECORD_SCHEMA.safeParse(candidate);
  return result.success ? result.data : null;
}
