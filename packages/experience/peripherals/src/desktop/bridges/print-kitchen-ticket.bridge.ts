/**
 * Stackra file contract:
 * Purpose: `PrintKitchenTicketBridge` (`peripherals.kitchen.print`), the kitchen printers behind the `KitchenPrinter`
 *          port: the renderer sends a ticket (text lines, and the ticket drawn as a raster when it has Arabic), main
 *          prints it on the station's named printer and answers which printer took it.
 * Boundary: main process only. The input comes from the renderer, so its shape and size are checked before a printer
 *           is touched; lines are printed as text and a raster as dots, so neither can carry a printer command. A
 *           printer that refuses becomes a `PrinterUnavailableError`, which the dispatcher sends back as an error
 *           envelope.
 * Runtime: node
 * Governing contract: ADR 0251 (decisions 1 to 3, as amended by 0294); ADR 0339 (decision 2); ADR 0250 (decision 3);
 *                     ADR 0449 (decision 1); registry A13 (the Bridge kind from @stackra/platform).
 */
import { PlatformCapability } from "@stackra/platform";
import { Bridge } from "@stackra/platform/desktop";

import type { KitchenPrinter } from "#contracts/ports/kitchen-printer.port";
import type { KitchenTicket } from "#contracts/types/kitchen-ticket.type";
import type { PrintedReceipt } from "#contracts/types/printed-receipt.type";
import { PrinterUnavailableError } from "#core/errors/printer-unavailable.error";

/** The longest order reference or station key, in characters. */
const MAX_ID = 64;

/** The most lines one ticket may have. */
const MAX_LINES = 500;

/** The longest line, in characters. */
const MAX_LINE = 256;

/** The widest raster, in dots (80 mm paper at 203 dpi is 576). */
const MAX_WIDTH = 1024;

/** The largest raster, in bytes. */
const MAX_RASTER = 1_048_576;

/** Whether `value` is an order id or a station key of an acceptable length. */
function isId(value: unknown): value is string {
  return typeof value === "string" && value !== "" && value.length <= MAX_ID;
}

/**
 * Prints a kitchen ticket on its station's printer.
 *
 * @example
 * // renderer, through the generated preload
 * await window.stackra.invoke("peripherals.kitchen.print", { orderId, station: "grill", lines: ["2x Shawarma"] });
 */
export class PrintKitchenTicketBridge extends Bridge({
  key: "kitchen.print",
  capability: PlatformCapability.Print,
}) {
  /** The kitchen printers the wiring binds (`peripherals.kitchenPrinter`). */
  private readonly printer: KitchenPrinter;

  /**
   * @param printer - the bound kitchen printers.
   */
  constructor(printer: KitchenPrinter) {
    super();
    this.printer = printer;
  }

  /**
   * Prints the ticket.
   *
   * @throws TypeError when the order id, the station, the lines or the raster is missing, malformed or too large.
   * @throws PrinterUnavailableError when the printer refuses the job.
   */
  async handle(input: KitchenTicket): Promise<PrintedReceipt> {
    const { orderId, station, lines, raster } = (input ?? {}) as Partial<KitchenTicket>;
    if (!isId(orderId))
      throw new TypeError(`kitchen.print needs an orderId of 1 to ${MAX_ID} characters`);
    if (!isId(station))
      throw new TypeError(`kitchen.print needs a station of 1 to ${MAX_ID} characters`);
    if (
      !Array.isArray(lines) ||
      lines.length > MAX_LINES ||
      !lines.every((line) => typeof line === "string" && line.length <= MAX_LINE)
    )
      throw new TypeError(
        `kitchen.print needs up to ${MAX_LINES} lines of at most ${MAX_LINE} characters`,
      );
    let ticket: KitchenTicket = { orderId, station, lines: [...lines] };
    if (raster !== undefined) {
      const { width, height, data } = (raster ?? {}) as Partial<NonNullable<typeof raster>>;
      if (
        typeof width !== "number" ||
        typeof height !== "number" ||
        !Number.isInteger(width) ||
        !Number.isInteger(height) ||
        width < 1 ||
        width > MAX_WIDTH ||
        height < 1 ||
        !(data instanceof Uint8Array) ||
        data.length > MAX_RASTER ||
        data.length !== Math.ceil(width / 8) * height
      )
        throw new TypeError("kitchen.print needs a raster of width, height and packed rows");
      ticket = { ...ticket, raster: { width, height, data } };
    }
    const printed = await this.printer.print(ticket);
    if (!printed.ok) throw PrinterUnavailableError.create({ reason: printed.error.code });
    return printed.data;
  }
}
