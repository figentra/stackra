/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/qr-code` (QR code).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave A, owner request 2026-10-29).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** QR code. */
export const FREE_QR_CODE: ComponentEntry = {
  slug: "qr-code",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "QrCode",
  parts: ["QrCode"],
  hero: {},
  examples: [{ id: "payment", card: true }, { id: "wifi" }, { id: "arabic", platforms: ["react"] }],
  related: ["free/copy-button", "free/link", "free/thumbnail"],
  tokens: ["radius.container"],
  keywords: ["qr", "qr code", "scan", "payment link", "wifi", "barcode"],
  status: "new",
};
