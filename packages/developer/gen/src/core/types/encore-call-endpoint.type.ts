/**
 * Stackra file contract:
 * Purpose: `EncoreCallEndpoint`, an action or query of a service's generated Encore app as `encoreEndpoints` reads it:
 *          its export, key, method, path, class, input shape and whether an anonymous caller may reach it.
 * Boundary: a type only. `emitEncoreApi` prints the adapters from these rows and `emitEncoreWiringTest` calls them, so
 *           the two never disagree on which endpoints exist.
 * Runtime: isomorphic
 * Governing contract: ADR 0091 (decision 2: the generated Encore app); ADR 0182 (decision 3: the thin Encore wiring
 *                     suite); STA-2063; STA-2838.
 */
import type { ClassRef } from "#core/types/class-ref.type";

/** An action or query of the manifest with an endpoint, answered through the action pipeline. */
export interface EncoreCallEndpoint {
  /** An action or query. */
  readonly kind: "call";

  /** The export in `api.ts`: the camel-cased key and version (`shop.order.cancel@1` is `shopOrderCancelV1`). */
  readonly name: string;

  /** The manifest key, with its version. */
  readonly key: string;

  /** The HTTP method. */
  readonly method: string;

  /** The path, with `:param` segments. */
  readonly path: string;

  /** Whether a call with no credential may reach it (its actors list `ActorKind.Anonymous`). */
  readonly anonymous: boolean;

  /** The action or query class, the member's own or a hosted package's. */
  readonly class: ClassRef;

  /** The member's input schema class, which types a GET or DELETE query string; absent for a hosted entry. */
  readonly input?: ClassRef;
}
