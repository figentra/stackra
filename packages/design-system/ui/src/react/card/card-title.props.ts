/**
 * Stackra file contract:
 * Purpose: `CardTitleProps`, the props of the web `CardTitle` in `card-title.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0304; WCAG 2.2
 *          SC 1.3.1.
 */
import type { CardTitleProps as HeroCardTitleProps } from "@heroui/react";
import type { ComponentPropsWithRef } from "react";
import type { CardTitleContractProps } from "#contracts/types/card-title-contract-props.type";

/**
 * Props of the web Card.Title: the shared contract plus HeroUI v3's own title props, except the element choice, which
 * the level owns.
 */
export type CardTitleProps = CardTitleContractProps &
  Omit<
    HeroCardTitleProps<"h3"> & Omit<ComponentPropsWithRef<"h3">, keyof HeroCardTitleProps<"h3">>,
    keyof CardTitleContractProps | "render"
  >;
