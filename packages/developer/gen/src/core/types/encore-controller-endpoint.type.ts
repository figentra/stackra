/**
 * Stackra file contract:
 * Purpose: `EncoreControllerEndpoint`, a raw controller of a service's generated Encore app as `encoreEndpoints` reads
 *          it: its export, path, Encore route and class.
 * Boundary: a type only. `emitEncoreApi` prints the adapters from these rows and `emitEncoreWiringTest` calls them, so
 *           the two never disagree on which endpoints exist.
 * Runtime: isomorphic
 * Governing contract: ADR 0091 (decision 2: the generated Encore app); ADR 0182 (decision 3: the thin Encore wiring
 *                     suite); STA-2063; STA-2838.
 */
import type { ClassRef } from "#core/types/class-ref.type";

/** A raw controller, reachable without a session and still behind every guard. */
export interface EncoreControllerEndpoint {
  /** A controller. */
  readonly kind: "controller";

  /** The export in `api.ts`: the camel-cased class name. */
  readonly name: string;

  /** The controller's path as it declares it (`/api/auth/*`). */
  readonly path: string;

  /** The Encore route: a trailing `/*` is Encore's named wildcard `/*rest`. */
  readonly route: string;

  /** The controller class, the member's own or a hosted package's. */
  readonly class: ClassRef;
}
