/**
 * Stackra file contract:
 * Purpose: `PrinterUnavailableError`, the refusal `PrintReceiptBridge` throws when the bound `ReceiptPrinter` refused
 *          the job, so the renderer gets an error envelope with code `printer_unavailable` instead of a print result.
 * Boundary: kind `Unavailable`, retryable: the printer may be back after the paper or the cable is fixed. Its one detail
 *           is why the printer refused (`unavailable`, `permission_denied`); never the receipt's lines.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds); ADR 0250 (decision 3); ADR 0294 (decisions 16 and 20).
 */
import { ErrorKind, Refusal } from "@stackra/errors";
import type { CapabilityRefusal } from "@stackra/platform/contracts";

/** Retryable: the printer may answer the next time. */
export class PrinterUnavailableError extends Refusal({
  kind: ErrorKind.Unavailable,
  retryable: true,
}) {
  /** Why the printer refused. */
  reason!: CapabilityRefusal["code"];
}
