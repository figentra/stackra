/**
 * Stackra file contract:
 * Purpose: `CardProps`, the props of the native `Card` in `card.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (HeroUI
 *          Native on native); ADR 0304; owner decision 6 of STA-350 (thin wrappers).
 */
import type { Card as HeroCard } from "heroui-native";
import type { ComponentPropsWithRef } from "react";
import type { CardContractProps } from "#contracts/types/card-contract-props.type";

/** Props of the native Card: the shared contract plus HeroUI Native's own card props, passed through unchanged. */
export type CardProps = CardContractProps &
  Omit<ComponentPropsWithRef<typeof HeroCard>, keyof CardContractProps>;
