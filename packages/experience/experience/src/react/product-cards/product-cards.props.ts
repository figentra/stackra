/**
 * Stackra file contract:
 * Purpose: `ProductCardsProps`, what a page hands the ProductCards: the products built on Stackra, the
 *          strip's name and its layout.
 * Boundary: an interface in its own file beside the component (ADR 0305). Names, descriptors, links and themes are page
 *           content; a product's theme is the `@stackra/tokens` `Theme` its card draws in.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0305 (`<name>.props.ts`); STA-2041.
 */
import type { BentoCardProps } from "@stackra/ui/react";

/**
 * The products built on Stackra, each a card in its own theme.
 *
 * @example
 * <ProductCards label="Built on Stackra" products={[{ id: "pay", name: "Pay", descriptor: "Payments", theme }]} />
 */
export interface ProductCardsProps {
  /** The strip's spoken name, such as "Built on Stackra". */
  readonly label: string;
  /** The products, in reading order. */
  readonly products: readonly {
    readonly id: string;
    /** The product's name, the card's heading. */
    readonly name: string;
    /** One line on what it is. */
    readonly descriptor: string;
    /** Its site; the card then carries one link. */
    readonly href?: string | undefined;
    /** The product's theme: its card draws in that brand's tokens. */
    readonly theme?: BentoCardProps["brand"];
  }[];
  /** The words of a product's link, such as "Visit"; defaults to the product's name. */
  readonly linkLabel?: string | undefined;
  /** `strip` scrolls the cards in a marquee (still and wrapped under reduced motion); `grid` lays them out. Defaults to `strip`. */
  readonly layout?: "strip" | "grid" | undefined;
  /** Styles the strip or the grid. */
  readonly className?: string | undefined;
}
