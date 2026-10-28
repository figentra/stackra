/**
 * Stackra file contract:
 * Purpose: the native `Card` compound on HeroUI Native's Card with the contract's part names: `Card.Content` is
 *          HeroUI Native's `Card.Body`; the title is announced as a heading.
 * Boundary: no styling of its own; a card is a container, never a press target. HeroUI Native's footer is a column,
 *          so a row of actions adds `className="flex-row"` at the call site. The compound exposes exactly the five
 *          contract parts: HeroUI Native's `Card.Body` is left out.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (HeroUI Native on native); ADR 0304; owner decision 6 of STA-350
 *          (thin wrappers).
 */
/* oxlint-disable react/only-export-components -- the compound is Object.assign(Root, parts), so the export is the
   root function, which React Refresh takes as a component; the boundary holds (rule-gap B-6). */
import { Card as HeroCard } from "heroui-native";
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { CardTitle } from "#native/card/card-title";
import type { CardProps } from "#native/card/card.props";

/** The card root: HeroUI Native's, so its surface context still reaches the components inside. */
function CardRoot({ variant, ...rest }: CardProps): ReactElement {
  return <HeroCard {...rest} {...omitUndefined({ variant })} />;
}

/** The parts of the compound, typed from HeroUI Native's own so the declaration output can name them. */
interface CardParts {
  /** The header, aligned to the leading edge. */
  readonly Header: typeof HeroCard.Header;
  /** The title, announced as a heading. */
  readonly Title: typeof CardTitle;
  /** The muted description under the title. */
  readonly Description: typeof HeroCard.Description;
  /** The body of the card: HeroUI Native's `Card.Body`, under the contract's name. */
  readonly Content: typeof HeroCard.Body;
  /** The footer, a column until the caller adds `flex-row`. */
  readonly Footer: typeof HeroCard.Footer;
}

/**
 * A card: a surface with padding, radius and the theme's surface shadow, holding `Card.Header`, `Card.Title`,
 * `Card.Description`, `Card.Content` and `Card.Footer`.
 */
export const Card: typeof CardRoot & CardParts = Object.assign(CardRoot, {
  Header: HeroCard.Header,
  Title: CardTitle,
  Description: HeroCard.Description,
  Content: HeroCard.Body,
  Footer: HeroCard.Footer,
});
