/**
 * Stackra file contract:
 * Purpose: `CardProps`, the props of the web `Card` in `card.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (HeroUI v3
 *          on web); ADR 0304; owner decision 6 of STA-350 (thin wrappers).
 */
import type { CardRootProps } from "@heroui/react";
import type { ComponentPropsWithRef } from "react";
import type { CardContractProps } from "#contracts/types/card-contract-props.type";

/** HeroUI's props for a `div` card: its own props plus the `div` attributes, as its generic signature spreads them. */
type HeroCardProps = CardRootProps<"div"> &
  Omit<ComponentPropsWithRef<"div">, keyof CardRootProps<"div">>;

/** Props of the web Card: the shared contract plus HeroUI v3's own card props, passed through unchanged. */
export type CardProps = CardContractProps & Omit<HeroCardProps, keyof CardContractProps>;
