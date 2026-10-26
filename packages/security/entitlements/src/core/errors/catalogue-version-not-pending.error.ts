/**
 * Stackra file contract:
 * Purpose: `CatalogueVersionNotPendingError`, the refusal to approve or reject a catalogue version that is not waiting
 *          for a decision, or does not exist (`catalogue_version_not_pending`).
 * Boundary: kind `Conflict` (HTTP 409), not retryable. Its details name the record key and version only.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds); ADR 0391 (decision 4).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The version is not pending.
 *
 * @example
 * throw CatalogueVersionNotPendingError.create({ key: "offer:founding", version: 3 });
 */
export class CatalogueVersionNotPendingError extends Refusal({
  kind: ErrorKind.Conflict,
  retryable: false,
}) {
  /** The record key. */
  key!: string;

  /** The version asked for. */
  version!: number;
}
