/**
 * Stackra file contract:
 * Purpose: `ZplLabelPrinterDriver`, the `LabelPrinter` driver of the desktop main process (`peripherals.labelPrinter:
 *          "zpl"`): it sends a ZPL label, or a raster label as a ZPL graphic field, to `peripherals.labelPrinterAddress`,
 *          a network label printer (`tcp://<host>:9100`) or a device path.
 * Boundary: main only, through `sendToPrinter`, with no native module. A ZPL document is sent as given with `^PQ`
 *           copies added before its last `^XZ`; a raster label goes through `zplRaster`. No address, a refused
 *           connection or a timeout resolves `unavailable`; `EACCES` or `EPERM` resolves `permission_denied`.
 * Runtime: node
 * Governing contract: ADR 0339 (decisions 1, 2 and 5); ADR 0250 (decision 3); ADR 0254 (work that needs Node runs in
 *                     main).
 */
import { Driver } from "@stackra/container";
import { Capability } from "@stackra/platform";
import type { CapabilityResult } from "@stackra/platform/contracts";

import { PeripheralsConfig } from "#config/peripherals.config";
import { LabelFormat } from "#contracts/enums/label-format.enum";
import { LabelPrinter } from "#contracts/ports/label-printer.port";
import type { Label } from "#contracts/types/label.type";
import type { PrintedLabel } from "#contracts/types/printed-label.type";
import { refuse } from "#core/functions/refuse.function";
import { zplRaster } from "#core/functions/zpl-raster.function";
import { sendToPrinter } from "#desktop/functions/send-to-printer.function";

/** The ZPL of `label`, `copies` times. */
function zplOf(label: Label): string {
  if (label.format === LabelFormat.Raster) return zplRaster(label.raster, label.copies);
  const end = label.zpl.lastIndexOf("^XZ");
  return `${label.zpl.slice(0, end)}^PQ${label.copies}${label.zpl.slice(end)}`;
}

/**
 * A ZPL label printer reached from main.
 *
 * @example
 * // generated main-process wiring, desktop target
 * { port: LabelPrinter, selectedBy: "config:peripherals.labelPrinter", candidates: { zpl: () => import("@stackra/peripherals/desktop").then((m) => m.ZplLabelPrinterDriver) } }
 */
export class ZplLabelPrinterDriver extends Driver(LabelPrinter) {
  /** The peripherals configuration, for the label printer's address. */
  private readonly config: PeripheralsConfig;

  /** @param config - the peripherals configuration. */
  constructor(config: PeripheralsConfig) {
    super();
    this.config = config;
  }

  /** Opens the connection or the device and sends nothing. */
  async probe(): Promise<CapabilityResult> {
    return this.send(new Uint8Array(0));
  }

  /** Prints the label's copies. */
  async print(label: Label): Promise<CapabilityResult<PrintedLabel>> {
    const sent = await this.send(new TextEncoder().encode(zplOf(label)));
    if (!sent.ok) return sent;
    return { ok: true, data: { printer: this.config.labelPrinterAddress, jobId: label.jobId } };
  }

  /** Sends `bytes` to the configured address, as a result. */
  private async send(bytes: Uint8Array): Promise<CapabilityResult> {
    const address = this.config.labelPrinterAddress;
    if (address === "") return refuse(Capability.Print, "unavailable");
    try {
      await sendToPrinter(address, bytes);
      return { ok: true, data: undefined };
    } catch (error) {
      const code = (error as { readonly code?: unknown }).code;
      return refuse(
        Capability.Print,
        code === "EACCES" || code === "EPERM" ? "permission_denied" : "unavailable",
      );
    }
  }
}
