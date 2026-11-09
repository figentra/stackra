/**
 * Stackra file contract:
 * Purpose: `LandingProduct`, one product on the "Built on Stackra" cards: its id, its brand, its name, its line and
 *          its site.
 * Boundary: a type only, the field type of `ProductCardsBlock`. A product's name is a name, never translated. `brand`
 *           names a theme the page passes in code (`themes`); a brand the page has no theme for draws in the page's own
 *           theme.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";

/** A product card. */
export interface LandingProduct {
  /** The product's id, unique on the cards. */
  readonly id: string;

  /** The theme's name in the page's `themes` (`pay`). */
  readonly brand?: string;

  /** The product's name, never translated. */
  readonly name: string;

  /** The product's line under its name. */
  readonly descriptor: LocalizedText;

  /** The product's site; the card is not a link when absent. */
  readonly href?: string;
}
