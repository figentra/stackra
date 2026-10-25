/**
 * Stackra file contract:
 * Purpose: `ServerAppOptions`, the second argument of `createApp` from `@stackra/app/server`: the member's generated
 *          wiring.
 * Boundary: a type only. The environment is the process's own; nothing else is configurable here.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 7).
 */
import type { Wiring } from "@stackra/container";

import type { AppSections } from "#core/types/app-sections.type";

/** The options of the server `createApp`. */
export interface ServerAppOptions {
  /** The member's `#stackra/wiring`. */
  readonly wiring: Wiring & AppSections;
}
