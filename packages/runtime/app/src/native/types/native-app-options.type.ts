/**
 * Stackra file contract:
 * Purpose: `NativeAppOptions`, the second argument of `createApp` from `@stackra/app/native`: the generated wiring.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0295 (decision 7).
 */
import type { Wiring } from "@stackra/container";

import type { AppSections } from "#core/types/app-sections.type";

/** The options of the native `createApp`. */
export interface NativeAppOptions {
  /** The member's `#stackra/wiring`. */
  readonly wiring: Wiring & AppSections;
}
