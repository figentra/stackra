/**
 * Stackra file contract:
 * Purpose: the web `Card.Title`: HeroUI's card title rendered as the `h<level>` element (default `h3`) through React
 *          Aria's `render`, so HeroUI's classes stay on it.
 * Boundary: reached as `Card.Title`; the barrel exports only its props type. The element is the level's, so `render`
 *          is not a prop here.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0304; WCAG 2.2 SC 1.3.1.
 */
import { Card as HeroCard } from "@heroui/react";
import { createElement, type ReactElement } from "react";
import type { CardTitleProps } from "#react/card/card-title.props";

/**
 * A card's title as a heading at `level` (default 3, below a section's 2), drawn in the card title's own look. HeroUI
 * ties the element to `h3`, which the outline must not be; React Aria's `render` swaps the element and keeps the
 * classes.
 */
export function CardTitle({ level = 3, ...rest }: CardTitleProps): ReactElement {
  return <HeroCard.Title {...rest} render={(domProps) => createElement(`h${level}`, domProps)} />;
}
