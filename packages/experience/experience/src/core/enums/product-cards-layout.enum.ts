/**
 * Stackra file contract:
 * Purpose: `ProductCardsLayout`, how the product cards are laid out: a grid, or a strip that scrolls.
 * Boundary: an `Enum.of` value plus the type of the same name; codes are snake_case and never shown as words.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0231 (snake_case codes); STA-2041.
 */
import { Enum } from "@stackra/contracts";

/** The layouts of the product cards. */
export const ProductCardsLayout = Enum.of({
  /** A grid, the default: on the landing nothing moves on its own but the pipe and the horizon. */
  Grid: "grid",
  /** A marquee strip, still and wrapped under reduced motion. */
  Strip: "strip",
});

/** One of the codes above. */
export type ProductCardsLayout = Enum.Value<typeof ProductCardsLayout>;
