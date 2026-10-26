/**
 * Stackra file contract:
 * Purpose: `MapMarkerProps`, props of `Map.Marker`: the shared contract plus HeroUI Pro's own, with `onClick` renamed
 *          `onPress`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import type { MapMarkerProps as HeroMapMarkerProps } from "@heroui-pro/react/map";

import type { MapMarkerContractProps } from "#contracts/types/map-marker-contract-props.type";

/** Props of `Map.Marker`: the shared contract plus HeroUI Pro's own, with `onClick` renamed `onPress`. */
export type MapMarkerProps = MapMarkerContractProps &
  Omit<HeroMapMarkerProps, keyof MapMarkerContractProps | "onClick">;
