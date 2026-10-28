/**
 * Stackra file contract:
 * Purpose: `ServerAppOptions`, the second argument of `createApp` from `@stackra/app/server`: the member's generated
 *          wiring, its generated boot and the health indicators `/readyz` runs besides the bound ones.
 * Boundary: a type only. The environment is the process's own; nothing else is configurable here.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 7); registry gap R-27; ADR 0263 (the container is ready before boot).
 */
import type { Container, Wiring } from "@stackra/container";
import type { HealthIndicator } from "@stackra/contracts";

import type { AppSections } from "#core/types/app-sections.type";

/** The options of the server `createApp`. */
export interface ServerAppOptions {
  /** The member's `#stackra/wiring`. */
  readonly wiring: Wiring & AppSections;

  /**
   * The member's `#stackra/boot`, awaited once the container is ready, with the signal `close()` aborts; none when
   * gen wrote no boot. The boot connects with its Encore database's url, so none is passed (STA-1401).
   */
  readonly boot?: (
    container: Container,
    options: { readonly signal: AbortSignal },
  ) => Promise<void>;

  /**
   * Indicators `GET /readyz` checks besides every `HealthIndicator` the container binds; with neither, the app is
   * ready as soon as booted.
   */
  readonly health?: readonly HealthIndicator[];
}
