/**
 * Stackra file contract:
 * Purpose: `ProductCardsProps`, what a page hands the ProductCards: the products built on Stackra, the group's
 *          name, the links' words, the themes the products' brands draw in and the layout.
 * Boundary: an interface in its own file beside the component (ADR 0305). Names, descriptors, links and brand names are
 *           page content; the themes are page code (`@stackra/tokens` `Theme`s), so a document names a brand and the
 *           page resolves it.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0305 (`<name>.props.ts`); STA-2041.
 */
import type { Theme } from "@stackra/tokens/contracts";

/**
 * The products built on Stackra, each a card in its own theme.
 *
 * @example
 * <ProductCards label="Built on Stackra" products={[{ id: "pay", brand: "pay", name: "Pay", descriptor: "Payments" }]}
 *   themes={{ pay: PAY_THEME }} />
 */
export interface ProductCardsProps {
  /** The group's spoken name, such as "Built on Stackra". */
  readonly label: string;
  /** The products, in reading order. */
  readonly products: readonly {
    readonly id: string;
    /** The product's brand: the key of its theme in `themes`. */
    readonly brand?: string | undefined;
    /** The product's name, the card's heading. */
    readonly name: string;
    /** One line on what it is. */
    readonly descriptor: string;
    /** Its site; the card then carries one link. */
    readonly href?: string | undefined;
  }[];
  /** The words of a product's link, such as "Visit"; defaults to the product's name. */
  readonly linkLabel?: string | undefined;
  /** The brands' themes by brand name; a product whose brand has none draws in the page's own theme. */
  readonly themes?: Readonly<Record<string, Theme>> | undefined;
  /**
   * `grid` (the default) lays the cards out; `strip` scrolls them in a marquee (still and wrapped under reduced
   * motion).
   */
  readonly layout?: "strip" | "grid" | undefined;
  /** Styles the strip or the grid. */
  readonly className?: string | undefined;
}
