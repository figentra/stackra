/**
 * Stackra file contract:
 * Purpose: `POS_DEVICE_FAMILIES`, the Sunmi, PAX and iMin terminal families: each one's Expo module and the vendor
 *          SDK's ready printer status (Sunmi `updatePrinterState()` 1, PAX NeptuneLite `IPrinter.getStatus()` 0, iMin
 *          `getPrinterStatus()` 0), from the vendors' public SDK documents.
 * Boundary: internal data: a vendor SDK's own table, like the GS1 identifiers, not a business value. Certification
 *           pending: read from public documents, not yet checked on a certified model (STA-739).
 * Runtime: isomorphic
 * Governing contract: ADR 0458 (Sunmi); ADR 0459 (PAX); ADR 0460 (iMin); ADR 0442 (decision 4).
 */
import type { PosDeviceFamily } from "#native/types/pos-device-family.type";

/** The POS terminal families, by driver name. */
export const POS_DEVICE_FAMILIES = Object.freeze({
  sunmi: { name: "sunmi", module: "StackraSunmi", printerReady: [1] },
  pax: { name: "pax", module: "StackraPax", printerReady: [0] },
  imin: { name: "imin", module: "StackraImin", printerReady: [0] },
} as const satisfies Record<PosDeviceFamily["name"], PosDeviceFamily>);
