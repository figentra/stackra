/**
 * Stackra file contract:
 * Purpose: the native `Card.Title`: HeroUI Native's card title with `accessibilityRole="header"`, which HeroUI Native
 *          leaves unset; `level` is accepted and dropped (React Native has no heading level).
 * Boundary: reached as `Card.Title`; the barrel exports only its props type. A caller's `accessibilityRole` wins.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0304; WCAG 2.2 SC 1.3.1.
 */
import type { ReactElement } from "react";
import { Card as HeroCard } from "heroui-native";
import type { CardTitleProps } from "#native/card/card-title.props";

/**
 * A card's title, announced as a heading. `level` keeps the shared contract and is not used: the header role carries
 * no level on iOS or Android.
 */
export function CardTitle({ level: _level, ...rest }: CardTitleProps): ReactElement {
  return <HeroCard.Title accessibilityRole="header" {...rest} />;
}
