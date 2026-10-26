/**
 * Stackra file contract:
 * Purpose: the web `ItemCardGroup` compound on HeroUI Pro's ItemCardGroup: the group root and the parts Header,
 *          Title and Description, with HeroUI Pro's own part names.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. `columns`, `layout` and
 *          `variant` are HeroUI Pro's, passed through. The compound exposes the documented parts: HeroUI Pro's
 *          `ItemCardGroup.Root` is left out.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import { ItemCardGroup as HeroItemCardGroup } from "@heroui-pro/react/item-card-group";

import type { ItemCardGroupProps } from "#react/item-card-group/item-card-group.props";

/** The group root: HeroUI Pro's, which lays its item cards out as a list or a grid. */
function ItemCardGroupRoot(props: ItemCardGroupProps) {
  return <HeroItemCardGroup.Root {...props} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface ItemCardGroupParts {
  /** The heading area above the cards. */
  readonly Header: typeof HeroItemCardGroup.Header;
  /** The group's title. */
  readonly Title: typeof HeroItemCardGroup.Title;
  /** A line of supporting text under the title. */
  readonly Description: typeof HeroItemCardGroup.Description;
}

/** A titled group of item cards: `ItemCardGroup.Header` with `Title` and `Description`, then the `ItemCard`s. */
export const ItemCardGroup: typeof ItemCardGroupRoot & ItemCardGroupParts = Object.assign(
  ItemCardGroupRoot,
  {
    Header: HeroItemCardGroup.Header,
    Title: HeroItemCardGroup.Title,
    Description: HeroItemCardGroup.Description,
  },
);
