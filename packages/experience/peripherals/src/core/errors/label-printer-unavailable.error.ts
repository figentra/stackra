/**
 * Stackra file contract:
 * Purpose: `LabelPrinterUnavailableError`, the refusal `PrintLabelBridge` throws when the bound `LabelPrinter` refused
 *          the job, so the renderer gets an error envelope with code `label_printer_unavailable`.
 * Boundary: kind `Unavailable`, retryable: the printer may be back after the labels or the cable are fixed. Its one
 *           detail is why the printer refused; never the label's content.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds); ADR 0250 (decision 3); ADR 0339 (decision 1).
 */
import { ErrorKind, Refusal } from "@stackra/errors";
import type { CapabilityRefusal } from "@stackra/platform/contracts";

/** Retryable: the printer may answer the next time. */
export class LabelPrinterUnavailableError extends Refusal({
  kind: ErrorKind.Unavailable,
  retryable: true,
}) {
  /** Why the printer refused. */
  reason!: CapabilityRefusal["code"];
}
