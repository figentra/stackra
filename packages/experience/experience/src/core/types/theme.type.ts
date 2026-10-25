/**
 * Stackra file contract:
 * Purpose: `Theme`, a section-based theme: named sections (a header, a footer, a product card), each an L2 document of
 *          the theme-section kind, and the theme's settings (tokens, fonts, layout choices) as JSON.
 * Boundary: a type only; data that references registered blocks, never markup or CSS. The experience service stores
 *           its revisions; this package commits, rolls back and compares them.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decisions 1 and 7: themes and branding are documents); ADR 0110; COM-216 to COM-218.
 */
import type { Json } from "@stackra/contracts";

import type { DocumentNode } from "#contracts/types/document-node.type";

/** A theme's content. */
export interface Theme {
  /** The section documents by section key (`header`, `product_card`). */
  readonly sections: Readonly<Record<string, DocumentNode>>;

  /** The theme's settings by key. */
  readonly settings: Readonly<Record<string, Json>>;
}
