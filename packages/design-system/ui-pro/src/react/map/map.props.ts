/**
 * Stackra file contract:
 * Purpose: `MapProps`, props of the web Map: the shared contract plus HeroUI Pro's own map props, with `aria-label`
 *          renamed `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import type { MapRootProps } from "@heroui-pro/react/map";

import type { MapContractProps } from "#contracts/types/map-contract-props.type";

/** Props of the web Map: the shared contract plus HeroUI Pro's own map props, with `aria-label` renamed `label`. */
export type MapProps = MapContractProps & Omit<MapRootProps, keyof MapContractProps | "aria-label">;
