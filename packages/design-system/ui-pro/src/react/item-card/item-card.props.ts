/**
 * Stackra file contract:
 * Purpose: `ItemCardProps`, props of the web ItemCard: the shared contract plus HeroUI Pro's own card props (those of
 *          a `div`), passed through unchanged.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import type { ItemCardRootProps } from "@heroui-pro/react/item-card";
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
