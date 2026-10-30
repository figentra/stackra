/**
 * Stackra file contract:
 * Purpose: `ComponentScreenProps`: props of `ComponentScreen`, the route the navigator gives it.
 * Boundary: a type only, in its own file beside the screen.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12).
 */
import type { RouteProp } from "@react-navigation/native";

import type { HomeStackParamList } from "#src/navigation/types";

/** Props of {@link ComponentScreen}. */
export interface ComponentScreenProps {
  /** The `Component` route: `{ tier, slug, tab?, example? }`. */
  readonly route: RouteProp<HomeStackParamList, "Component">;
}
