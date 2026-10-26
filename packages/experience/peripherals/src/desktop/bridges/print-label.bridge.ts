/**
 * Stackra file contract:
 * Purpose: `PrintLabelBridge` (`peripherals.label.print`), the label printer behind the `LabelPrinter` port: the
 *          renderer sends a label (a ZPL document from a label template, or a raster image), main prints it on the
 *          bound label printer and answers which printer took it.
 * Boundary: main process only. The input comes from the renderer, so its shape and size are checked before the printer
 *           is touched. A ZPL document must be one label (`^XA` to `^XZ`) and may carry no host-control command
 *           (`~...`) and no `^J` setup command, so a page cannot reconfigure or reset the printer. A printer that
 *           refuses becomes a `LabelPrinterUnavailableError`.
 * Runtime: node
 * Governing contract: ADR 0251 (decisions 1 to 3); ADR 0339 (decisions 1, 2 and 5); ADR 0250 (decision 3); registry
 *                     A13 (the Bridge kind from @stackra/platform).
 */
import { Capability } from "@stackra/platform";
import { Bridge } from "@stackra/platform/desktop";

import { LabelFormat } from "#contracts/enums/label-format.enum";
import type { LabelPrinter } from "#contracts/ports/label-printer.port";
import type { Label } from "#contracts/types/label.type";
import type { PrintedLabel } from "#contracts/types/printed-label.type";
import { LabelPrinterUnavailableError } from "#core/errors/label-printer-unavailable.error";

/** The longest job id, in characters. */
const MAX_JOB_ID = 64;

/** The most copies one job may ask for. */
const MAX_COPIES = 999;

/** The largest ZPL document, in characters. */
const MAX_ZPL = 65_536;

/** The largest raster, in bytes (a 4-inch label at 203 dpi is about 50 KB). */
const MAX_RASTER = 1_048_576;

/** One label, with no host-control (`~`) or `^J` setup command. */
const SAFE_ZPL = /^\s*\^XA(?:(?!\^XA|\^J|~)[\s\S])*\^XZ\s*$/;

/**
 * Prints a label on the bound label printer.
 *
 * @example
 * // renderer, through the generated preload
 * await window.stackra.invoke("peripherals.label.print", { jobId, copies: 1, format: "zpl", zpl });
 */
export class PrintLabelBridge extends Bridge({
  key: "label.print",
  capability: Capability.Print,
}) {
  /** The label printer the wiring binds (`peripherals.labelPrinter`). */
  private readonly printer: LabelPrinter;

  /**
   * @param printer - the bound label printer.
   */
  constructor(printer: LabelPrinter) {
    super();
    this.printer = printer;
  }

  /**
   * Prints the label.
   *
   * @throws TypeError when the job id, the copies, the format or the document is missing, malformed or too large.
   * @throws LabelPrinterUnavailableError when the printer refuses the job.
   */
  async handle(input: Label): Promise<PrintedLabel> {
    const { jobId, copies, format } = (input ?? {}) as Partial<Label>;
    if (typeof jobId !== "string" || jobId === "" || jobId.length > MAX_JOB_ID)
      throw new TypeError(`label.print needs a jobId of 1 to ${MAX_JOB_ID} characters`);
    if (
      typeof copies !== "number" ||
      !Number.isInteger(copies) ||
      copies < 1 ||
      copies > MAX_COPIES
    )
      throw new TypeError(`label.print needs 1 to ${MAX_COPIES} copies`);
    let label: Label;
    if (format === LabelFormat.Zpl) {
      const { zpl } = input as Partial<Extract<Label, { format: "zpl" }>>;
      if (typeof zpl !== "string" || zpl.length > MAX_ZPL || !SAFE_ZPL.test(zpl))
        throw new TypeError("label.print needs one ZPL label (^XA to ^XZ) with no ~ or ^J command");
      label = { jobId, copies, format, zpl };
    } else if (format === LabelFormat.Raster) {
      const { raster } = input as Partial<Extract<Label, { format: "raster" }>>;
      const { width, height, data } = (raster ?? {}) as Partial<NonNullable<typeof raster>>;
      if (
        typeof width !== "number" ||
        typeof height !== "number" ||
        !(data instanceof Uint8Array) ||
        data.length > MAX_RASTER ||
        data.length !== Math.ceil(width / 8) * height
      )
        throw new TypeError("label.print needs a raster of width, height and packed rows");
      label = { jobId, copies, format, raster: { width, height, data } };
    } else {
      throw new TypeError("label.print needs the format zpl or raster");
    }
    const printed = await this.printer.print(label);
    if (!printed.ok) throw LabelPrinterUnavailableError.create({ reason: printed.error.code });
    return printed.data;
  }
}
