/**
 * Stackra file contract:
 * Purpose: `escposKitchenTicket`, the ESC/POS bytes of one kitchen ticket: initialise the printer, print the ticket's
 *          raster image (`GS v 0`) or, without one, its lines as text, feed past the cutter, make a partial cut, then
 *          sound the printer's buzzer when the named printer has one configured.
 * Boundary: internal; pure. Text lines go through `escposReceipt`'s rule (printable ASCII only), so no line can carry
 *           a command; Arabic needs the raster. The buzzer is `ESC B n t` (n beeps, t × 50 ms), the command of the
 *           common kitchen printers; a printer that ignores it prints the ticket silently.
 * Runtime: isomorphic
 * Governing contract: ADR 0339 (decision 2: Arabic prints as raster); ADR 0253 (decision 4); ADR 0449 (decision 1).
 */
import type { KitchenTicket } from "#contracts/types/kitchen-ticket.type";
import type { RasterImage } from "#contracts/types/raster-image.type";
import { escposReceipt } from "#core/functions/escpos-receipt.function";

/** ESC and GS. */
const ESC = 0x1b;
const GS = 0x1d;

/** The bytes of `GS v 0` (normal size) printing `raster`. */
function escposRaster(raster: RasterImage): number[] {
  const rowBytes = Math.ceil(raster.width / 8);
  if (raster.data.length !== rowBytes * raster.height)
    throw new RangeError("a raster needs ceil(width / 8) × height bytes");
  return [
    GS,
    0x76,
    0x30,
    0,
    rowBytes & 0xff,
    rowBytes >> 8,
    raster.height & 0xff,
    raster.height >> 8,
    ...raster.data,
  ];
}

/**
 * The bytes that print `ticket`, cut, and beep `buzz` when given.
 *
 * @example
 * escposKitchenTicket({ orderId: "ord_1", station: "grill", lines: ["2x Shawarma"] }, { times: 2, length: 3 });
 * @throws RangeError when the raster's data does not match its size.
 */
export function escposKitchenTicket(
  ticket: KitchenTicket,
  buzz: { readonly times: number; readonly length: number } | null,
): Uint8Array {
  const bytes =
    ticket.raster === undefined
      ? [...escposReceipt(ticket.lines)]
      : [ESC, 0x40, ...escposRaster(ticket.raster), ESC, 0x64, 4, GS, 0x56, 0x01];
  if (buzz !== null) bytes.push(ESC, 0x42, buzz.times, buzz.length);
  return Uint8Array.from(bytes);
}
