/**
 * Stackra file contract:
 * Purpose: `CardTitleProps`, the props of the native `CardTitle` in `card-title.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0304; WCAG 2.2
 *          SC 1.3.1.
 */
import type { CardTitleProps as HeroCardTitleProps } from "heroui-native";
import type { CardTitleContractProps } from "#contracts/types/card-title-contract-props.type";

/** Props of the native Card.Title: the shared contract plus HeroUI Native's own title props, passed through. */
export type CardTitleProps = CardTitleContractProps &
  Omit<HeroCardTitleProps, keyof CardTitleContractProps>;
