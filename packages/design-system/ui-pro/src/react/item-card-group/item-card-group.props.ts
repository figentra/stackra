/**
 * Stackra file contract:
 * Purpose: `ItemCardGroupProps`, props of the web ItemCardGroup: the shared contract plus HeroUI Pro's own group
 *          props, passed through unchanged.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import type { ItemCardGroupRootProps } from "@heroui-pro/react/item-card-group";

import type { ItemCardGroupContractProps } from "#contracts/types/item-card-group-contract-props.type";

/** Props of the web ItemCardGroup: the shared contract plus HeroUI Pro's own group props, passed through unchanged. */
export type ItemCardGroupProps = ItemCardGroupContractProps &
  Omit<ItemCardGroupRootProps, keyof ItemCardGroupContractProps>;
