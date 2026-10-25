/**
 * Stackra file contract:
 * Purpose: `ServerAppOptions`, the second argument of `createApp` from `@stackra/app/server`: the member's generated
 *          wiring and the health indicators `/readyz` runs.
 * Boundary: a type only. The environment is the process's own; nothing else is configurable here.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 7); registry gap R-27.
 */
import type { Wiring } from "@stackra/container";
import type { HealthIndicator } from "@stackra/contracts";

import type { AppSections } from "#core/types/app-sections.type";

/** The options of the server `createApp`. */
export interface ServerAppOptions {
  /** The member's `#stackra/wiring`. */
  readonly wiring: Wiring & AppSections;

  /** The dependencies `GET /readyz` checks; none means ready as soon as booted. */
  readonly health?: readonly HealthIndicator[];
}
