/**
 * Stackra file contract:
 * Purpose: `LandingProduct`, one product on the "Built on Stackra" cards: its id, its brand, its name, its line and
 *          its site.
 * Boundary: a shape class only, the field type of `ProductCardsBlock`; gen compiles it with the block. A product's
 *           name is a name, never translated. `brand` names a theme the page passes in code (`themes`); a brand the
 *           page has no theme for draws in the page's own theme.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0305 (one declaration per file); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";
import { Schema } from "@stackra/validation";

/** A product card. */
export class LandingProduct extends Schema {
  id!: string;

  /** The theme's name in the page's `themes` (`pay`). */
  brand?: string;

  name!: string;

  descriptor!: LocalizedText;

  href?: string;
}
