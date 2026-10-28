/**
 * Stackra file contract:
 * Purpose: `MemoryLabelPrinterDriver`, the `LabelPrinter` driver that prints into memory: the `memory` candidate
 *          (`peripherals.labelPrinter: "memory"`), the driver of tests and of a till with no label printer yet.
 * Boundary: no device is touched. `printed` records each job in order; a test sets `isPresent = false` to see the
 *           refusal a missing printer gives. The constructor takes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0339 (decision 1); ADR 0266 (memory drivers first); ADR 0269 (fakes are real drivers).
 */
import { Driver } from "@stackra/container";
import { PlatformCapability } from "@stackra/platform";
import type { CapabilityResult } from "@stackra/platform/contracts";

import { LabelPrinter } from "#contracts/ports/label-printer.port";
import type { Label } from "#contracts/types/label.type";
import type { PrintedLabel } from "#contracts/types/printed-label.type";
import { refuse } from "#core/functions/refuse.function";

/**
 * A label printer in memory.
 *
 * @example
 * const labels = new MemoryLabelPrinterDriver();
 * await labels.print({ jobId: "job_1", copies: 1, format: LabelFormat.Zpl, zpl: "^XA^XZ" });
 * labels.printed; // [the label]
 */
export class MemoryLabelPrinterDriver extends Driver(LabelPrinter) {
  /** Every label printed, in order. */
  readonly printed: Label[] = [];

  /** Whether the printer answers; false makes every call refuse with `unavailable`. */
  isPresent = true;

  /** Answers while present. */
  async probe(): Promise<CapabilityResult> {
    if (!this.isPresent) return refuse(PlatformCapability.Print, "unavailable");
    return { ok: true, data: undefined };
  }

  /** Records the label. */
  async print(label: Label): Promise<CapabilityResult<PrintedLabel>> {
    if (!this.isPresent) return refuse(PlatformCapability.Print, "unavailable");
    this.printed.push(label);
    return { ok: true, data: { printer: "memory", jobId: label.jobId } };
  }
}
