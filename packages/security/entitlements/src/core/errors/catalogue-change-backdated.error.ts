/**
 * Stackra file contract:
 * Purpose: `CatalogueChangeBackdatedError`, the refusal of a catalogue change dated before now
 *          (`catalogue_change_backdated`): a change applies to terms that start or renew from its date, never to one
 *          already running.
 * Boundary: kind `Validation` (HTTP 400), not retryable. Its details name the record key and the refused date.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds); ADR 0391 (decision 3); owner OS-82 (changes at renewal).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The change is dated in the past.
 *
 * @example
 * throw CatalogueChangeBackdatedError.create({ key: "price-list:commerce", effectiveFrom: "2026-01-01T00:00:00.000Z" });
 */
export class CatalogueChangeBackdatedError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** The record key. */
  key!: string;

  /** The refused date, ISO 8601. */
  effectiveFrom!: string;
}
