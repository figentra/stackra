/**
 * Stackra file contract:
 * Purpose: `TransferRefusedError`, the refusal of a cross-region release the sending legal entity's data-transfer
 *          rules do not allow (`transfer_refused`).
 * Boundary: kind `Forbidden`, not retryable; its details name the item kind only. The audit record of the attempt is
 *           the OS service's.
 * Runtime: isomorphic
 * Governing contract: ADR 0140; ADR 0343 (decision 4).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The transfer rules refuse this release.
 *
 * @example
 * throw TransferRefusedError.create({ itemKind: "document" });
 */
export class TransferRefusedError extends Refusal({
  kind: ErrorKind.Forbidden,
  retryable: false,
}) {
  /** The item kind refused. */
  itemKind!: string;
}
