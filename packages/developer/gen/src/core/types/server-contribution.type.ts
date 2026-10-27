/**
 * Stackra file contract:
 * Purpose: `ServerContribution`, one row of `SERVER_CONTRIBUTIONS`: the package a service must declare, the class gen
 *          binds, its constructor tokens in parameter order and the config rows those tokens need.
 * Boundary: a type only; internal to gen.
 * Runtime: isomorphic
 * Governing contract: ADR 0457 (multi-binding); STA-1385.
 */
import type { ClassRef } from "#core/types/class-ref.type";

/** One extension-point contribution gen binds in a service. */
export interface ServerContribution {
  /** The package the service must declare, `@stackra/cache`. */
  readonly package: string;

  /** The class bound. */
  readonly provide: ClassRef;

  /** Its constructor tokens, in parameter order. */
  readonly deps: readonly ClassRef[];

  /** The config rows its tokens need, by key. */
  readonly configs: readonly { readonly key: string; readonly provide: ClassRef }[];
}
