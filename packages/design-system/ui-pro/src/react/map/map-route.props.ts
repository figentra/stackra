/**
 * Stackra file contract:
 * Purpose: `MapRouteProps`, props of `Map.Route`: the shared contract plus HeroUI Pro's own, with `onClick` renamed
 *          `onPress`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import type { MapRouteProps as HeroMapRouteProps } from "@heroui-pro/react/map";

import type { MapRouteContractProps } from "#contracts/types/map-route-contract-props.type";

/** Props of `Map.Route`: the shared contract plus HeroUI Pro's own, with `onClick` renamed `onPress`. */
export type MapRouteProps = MapRouteContractProps &
  Omit<HeroMapRouteProps, keyof MapRouteContractProps | "onClick">;
