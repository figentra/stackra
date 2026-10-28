/**
 * Stackra file contract:
 * Purpose: `ReceiptPrinterVendor`, one receipt printer vendor family the module drives: its driver name, how its
 *          printer is reached, how the vendor SDK spells a network target, and the SDK status codes that mean ready.
 * Boundary: a type only; the four families are `RECEIPT_PRINTER_VENDORS`. Which families a build links is the
 *           runway's `device:<family>` list, applied by the config plugin (ADR 0442 decision 3), never this type.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decisions 2 and 5); ADR 0458; ADR 0459; ADR 0442 (decision 3).
 */

/** A receipt printer vendor family. */
export interface ReceiptPrinterVendor {
  /** The driver name in `peripherals.printer`, and the vendor name the module takes. */
  readonly name: "epson" | "star" | "sunmi" | "pax";
  /** `network`: a printer at `peripherals.printerAddress`; `built-in`: the terminal's own printer. */
  readonly reach: "network" | "built-in";
  /** What the vendor SDK puts before a network host (`TCP:` for Epson); empty for a bare host or a built-in printer. */
  readonly targetPrefix: string;
  /** The vendor SDK printer status codes that mean ready; any other code refuses. */
  readonly printerReady: readonly number[];
}
