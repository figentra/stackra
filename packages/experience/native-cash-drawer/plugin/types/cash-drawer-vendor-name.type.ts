/**
 * Stackra file contract:
 * Purpose: `CashDrawerVendorName`, a terminal family with a built-in drawer port the config plugin can link, as the
 *          runway's `device:<family>` names it.
 * Boundary: a type only; it equals the driver names of `CASH_DRAWER_VENDORS` in `src/`. A drawer on an Epson or Star
 *           printer needs no family here: @stackra/native-receipt-printer links that printer.
 * Runtime: node
 * Governing contract: ADR 0478 (decision 2); ADR 0442 (decision 3).
 */

/** A drawer port family. */
export type CashDrawerVendorName = "sunmi" | "pax";
