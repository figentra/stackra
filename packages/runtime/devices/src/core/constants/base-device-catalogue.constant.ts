/**
 * Stackra file contract:
 * Purpose: `BASE_DEVICE_CATALOGUE`, the device-catalogue rows Stackra ships as the base every product's seed pack
 *          starts from: a staffed till, a self-service kiosk, a self-checkout lane with its bagging scale, the lane's
 *          customer display, and an entry or exit gate.
 * Boundary: seed data, not behaviour: a product's `seed-pack:<product>` device catalogue adds, edits or drops rows,
 *           and an admin edits them after; `deviceCatalogueOf` reads them. No code compares a kind's key.
 * Runtime: isomorphic
 * Governing contract: ADR 0430 (decision 2); R3-SO-10; GRO-95, RES-6, US-128, RV-45 (kiosks, lanes and gates).
 */

import type { Json } from "@stackra/contracts";

/** The base device-catalogue rows. */
export const BASE_DEVICE_CATALOGUE: readonly Readonly<Record<string, Json>>[] = Object.freeze([
  {
    record: "device_kind",
    key: "till",
    unattended: false,
    customerFacing: false,
    peripherals: [
      "receipt_printer",
      "cash_drawer",
      "barcode_scanner",
      "customer_display",
      "card_terminal",
      "scale",
    ],
  },
  {
    record: "device_kind",
    key: "kiosk",
    unattended: true,
    customerFacing: true,
    peripherals: ["receipt_printer", "barcode_scanner", "card_terminal"],
  },
  {
    record: "device_kind",
    key: "lane",
    unattended: true,
    customerFacing: true,
    peripherals: ["receipt_printer", "barcode_scanner", "card_terminal", "scale"],
  },
  {
    record: "device_kind",
    key: "lane_display",
    unattended: true,
    customerFacing: true,
    peripherals: [],
  },
  {
    record: "device_kind",
    key: "gate",
    unattended: true,
    customerFacing: true,
    peripherals: ["access_controller"],
  },
]);
