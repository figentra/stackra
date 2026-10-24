/**
 * Stackra file contract:
 * Purpose: the web `ItemCard` compound on HeroUI Pro's ItemCard: the card root and the parts Icon, Content, Title,
 *          Description and Action, with HeroUI Pro's own part names.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. The root renders a `div`;
 *          HeroUI Pro's `render` prop, which swaps the element, passes through. The compound exposes the documented
 *          parts: HeroUI Pro's `ItemCard.Root` is left out.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import { ItemCard as HeroItemCard, type ItemCardRootProps } from "@heroui-pro/react/item-card";
import type { ComponentPropsWithoutRef } from "react";

import type { ItemCardContractProps } from "#contracts/types/item-card-contract-props.type";

/**
 * Props of the web ItemCard: the shared contract plus HeroUI Pro's own card props (those of a `div`), passed through
 * unchanged.
 */
export type ItemCardProps = ItemCardContractProps &
  Omit<ItemCardRootProps<"div">, keyof ItemCardContractProps> &
  Omit<
    ComponentPropsWithoutRef<"div">,
    keyof ItemCardRootProps<"div"> | keyof ItemCardContractProps
  >;

/** The card root: HeroUI Pro's, a surface that holds one item. */
// shortcut: the root is typed for its default `div`; HeroUI Pro's generic over other elements returns when a caller
// needs `render` to produce a typed link or button.
function ItemCardRoot(props: ItemCardProps) {
  return <HeroItemCard.Root {...props} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface ItemCardParts {
  /** The leading icon. */
  readonly Icon: typeof HeroItemCard.Icon;
  /** The text column holding the title and description. */
  readonly Content: typeof HeroItemCard.Content;
  /** The item's name. */
  readonly Title: typeof HeroItemCard.Title;
  /** A line of supporting text. */
  readonly Description: typeof HeroItemCard.Description;
  /** The trailing control, such as a switch or a button. */
  readonly Action: typeof HeroItemCard.Action;
}

/** A card for one item: `ItemCard.Icon`, `ItemCard.Content` with `Title` and `Description`, `ItemCard.Action`. */
export const ItemCard: typeof ItemCardRoot & ItemCardParts = Object.assign(ItemCardRoot, {
  Icon: HeroItemCard.Icon,
  Content: HeroItemCard.Content,
  Title: HeroItemCard.Title,
  Description: HeroItemCard.Description,
  Action: HeroItemCard.Action,
});
