/**
 * Stackra file contract:
 * Purpose: `AppWiring`, the booted member's generated wiring as a container token: `bootApp` binds it, so `Contexts`
 *          and the target runtimes read the sections @stackra/app owns (`contexts`, `messages`) and the bindings from
 *          the container a component or an adapter already holds.
 * Boundary: holds the wiring; it builds nothing. Bound as an override by `bootApp`, never listed in a wiring.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decisions 7, 8 and 10); ADR 0263 (decision 11: sections other packages own).
 */
import type { Wiring } from "@stackra/container";

import type { AppSections } from "#core/types/app-sections.type";

/**
 * The wiring the running app booted from.
 *
 * @example
 * const { wiring } = useContainer().get(AppWiring);
 * const keys = wiring.contexts ?? Object.keys(wiring.modules ?? {});
 */
export class AppWiring {
  /** The member's generated wiring, with the sections this package reads. */
  readonly wiring: Wiring & AppSections;

  /** Keeps `wiring` as it is. */
  constructor(wiring: Wiring & AppSections) {
    this.wiring = wiring;
  }
}
