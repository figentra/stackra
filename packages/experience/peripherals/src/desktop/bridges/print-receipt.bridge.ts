/**
 * Stackra file contract:
 * Purpose: `PrintReceiptBridge` (`peripherals.receipt.print`), the receipt printer behind the `ReceiptPrinter` port:
 *          the renderer sends a receipt, main prints it on the bound printer and answers which printer took it.
 * Boundary: main process only. The input comes from the renderer, so its shape and size are checked before the printer
 *           is touched; the lines are printed as text, so no line can carry a printer command. A printer that refuses
 *           becomes a `PrinterUnavailableError`, which the dispatcher sends back as an error envelope.
 * Runtime: node
 * Governing contract: ADR 0251 (decisions 1 to 3, as amended by 0294); ADR 0253 (decision 4); ADR 0250 (decision 3);
 *                     registry A13 (the Bridge kind from @stackra/platform).
 */
import { PlatformCapability } from "@stackra/platform";
import { Bridge } from "@stackra/platform/desktop";

import type { ReceiptPrinter } from "#contracts/ports/receipt-printer.port";
import type { PrintedReceipt } from "#contracts/types/printed-receipt.type";
import type { Receipt } from "#contracts/types/receipt.type";
import { PrinterUnavailableError } from "#core/errors/printer-unavailable.error";

/** The longest order reference, in characters. */
const MAX_ORDER_ID = 64;

/** The most lines one receipt may have. */
const MAX_LINES = 1000;

/** The longest line, in characters; a receipt line is far shorter. */
const MAX_LINE = 256;

/**
 * Prints a receipt on the bound printer.
 *
 * @example
 * // renderer, through the generated preload
 * const result = await window.stackra.invoke("peripherals.receipt.print", { orderId, lines: ["Total 12.00"] });
 * if (result.ok) toast.success(t(I18n.console.receipt.printed, { printer: result.data.printer }));
 */
export class PrintReceiptBridge extends Bridge({
  key: "receipt.print",
  capability: PlatformCapability.Print,
}) {
  /** The printer the wiring binds (`peripherals.printer`). */
  private readonly printer: ReceiptPrinter;

  /**
   * @param printer - the bound receipt printer.
   */
  constructor(printer: ReceiptPrinter) {
    super();
    this.printer = printer;
  }

  /**
   * Prints the receipt.
   *
   * @throws TypeError when the order id or the lines are missing, of the wrong type or too long.
   * @throws PrinterUnavailableError when the printer refuses the job.
   */
  async handle(input: Receipt): Promise<PrintedReceipt> {
    const { orderId, lines } = (input ?? {}) as Partial<Receipt>;
    if (typeof orderId !== "string" || orderId === "" || orderId.length > MAX_ORDER_ID)
      throw new TypeError(`receipt.print needs an orderId of 1 to ${MAX_ORDER_ID} characters`);
    if (
      !Array.isArray(lines) ||
      lines.length > MAX_LINES ||
      !lines.every((line) => typeof line === "string" && line.length <= MAX_LINE)
    )
      throw new TypeError(
        `receipt.print needs up to ${MAX_LINES} lines of at most ${MAX_LINE} characters`,
      );
    const printed = await this.printer.print({ orderId, lines: [...lines] });
    if (!printed.ok) throw PrinterUnavailableError.create({ reason: printed.error.code });
    return printed.data;
  }
}
