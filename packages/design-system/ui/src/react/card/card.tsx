/**
 * Stackra file contract:
 * Purpose: the web `Card` compound on HeroUI v3's Card: the root and the parts Header, Title, Description, Content
 *          and Footer, the title placed in the outline by `level`; every other HeroUI prop passes through.
 * Boundary: no styling of its own; a card is a container, never a press target (a pressable row is a ListItem).
 *          The compound exposes exactly the five contract parts: HeroUI's `Card.Root` is left out.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (HeroUI v3 on web); ADR 0304; owner decision 6 of STA-350
 *          (thin wrappers).
 */
import { Card as HeroCard, type CardRootProps } from "@heroui/react";
import type { ComponentPropsWithRef, ReactElement } from "react";

import type { CardContractProps } from "#contracts/types/card-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { CardTitle } from "#react/card/card-title";

/** HeroUI's props for a `div` card: its own props plus the `div` attributes, as its generic signature spreads them. */
type HeroCardProps = CardRootProps<"div"> &
  Omit<ComponentPropsWithRef<"div">, keyof CardRootProps<"div">>;

/** Props of the web Card: the shared contract plus HeroUI v3's own card props, passed through unchanged. */
export type CardProps = CardContractProps & Omit<HeroCardProps, keyof CardContractProps>;

/** The card root: HeroUI's, so its `SurfaceContext` still reaches the fields inside a non-transparent card. */
function CardRoot({ variant, ...rest }: CardProps): ReactElement {
  return <HeroCard {...rest} {...omitUndefined({ variant })} />;
}

/** The parts of the compound, typed from HeroUI's own so the declaration output can name them. */
interface CardParts {
  /** The header: a column for the title and description. */
  readonly Header: typeof HeroCard.Header;
  /** The title, a heading placed in the outline by its `level`. */
  readonly Title: typeof CardTitle;
  /** The muted description under the title. */
  readonly Description: typeof HeroCard.Description;
  /** The body of the card. */
  readonly Content: typeof HeroCard.Content;
  /** The footer: a row for actions. */
  readonly Footer: typeof HeroCard.Footer;
}

/**
 * A card: a surface with padding, radius and the theme's surface shadow, holding `Card.Header`, `Card.Title`,
 * `Card.Description`, `Card.Content` and `Card.Footer`. Name a card for assistive technology with `role="article"`
 * and `aria-labelledby` pointing at its title.
 */
export const Card: typeof CardRoot & CardParts = Object.assign(CardRoot, {
  Header: HeroCard.Header,
  Title: CardTitle,
  Description: HeroCard.Description,
  Content: HeroCard.Content,
  Footer: HeroCard.Footer,
});
