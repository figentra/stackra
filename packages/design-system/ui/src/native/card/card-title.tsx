/**
 * Stackra file contract:
 * Purpose: the native `Card.Title`: HeroUI Native's card title with `accessibilityRole="header"`, which HeroUI Native
 *          leaves unset; `level` is accepted and dropped (React Native has no heading level).
 * Boundary: reached as `Card.Title`; the barrel exports only its props type. A caller's `accessibilityRole` wins.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0304; WCAG 2.2 SC 1.3.1.
 */
import { Card as HeroCard, type CardTitleProps as HeroCardTitleProps } from "heroui-native";

import type { CardTitleContractProps } from "#contracts/types/card-title-contract-props.type";

/** Props of the native Card.Title: the shared contract plus HeroUI Native's own title props, passed through. */
export type CardTitleProps = CardTitleContractProps &
  Omit<HeroCardTitleProps, keyof CardTitleContractProps>;

/**
 * A card's title, announced as a heading. `level` keeps the shared contract and is not used: the header role carries
 * no level on iOS or Android.
 */
export function CardTitle({ level: _level, ...rest }: CardTitleProps) {
  return <HeroCard.Title accessibilityRole="header" {...rest} />;
}
