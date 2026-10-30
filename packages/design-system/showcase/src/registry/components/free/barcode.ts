/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/barcode` (Barcode).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Barcode entry of the component registry. */
export const FREE_BARCODE: ComponentEntry = {
  slug: "barcode",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Barcode",
  parts: ["Barcode"],
  // Our own Code 128 and EAN-13 encoders in core; no dependency.
  hero: {},
  examples: [{ id: "product-ean", card: true }, { id: "shipping-label" }, { id: "invalid" }],
  related: ["free/qr-code", "free/copy-button", "free/thumbnail"],
  tokens: ["radius.container"],
  keywords: ["barcode", "ean", "ean-13", "code 128", "sku", "label", "scan"],
  status: "new",
};
