/**
 * Stackra file contract:
 * Purpose: `CASH_DRAWER_VENDORS`, the Sunmi and PAX terminal families with a built-in drawer port and the ready status
 *          of the printer that drives it (Sunmi `updatePrinterState()` 1, PAX NeptuneLite `IPrinter.getStatus()` 0),
 *          from the vendors' public SDK documents.
 * Boundary: internal data: a vendor SDK's own table, not a business value. Certification pending (STA-739).
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decision 5); ADR 0458 (decision 3); ADR 0459 (decision 3).
 */
import type { CashDrawerVendor } from "#core/types/cash-drawer-vendor.type";

/** The drawer port families, by driver name. */
export const CASH_DRAWER_VENDORS = Object.freeze({
  sunmi: { name: "sunmi", printerReady: [1] },
  pax: { name: "pax", printerReady: [0] },
} as const satisfies Record<CashDrawerVendor["name"], CashDrawerVendor>);
