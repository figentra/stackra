/**
 * Stackra file contract:
 * Purpose: `Lifetime`, both the class facet `@Lifetime(Lifetime.Request)` and the three lifetimes a binding may
 *          have: one instance per container (the default), one per request, or a new one on every resolution.
 * Boundary: the only DI lifetime marker (ADR 0294 decision 17); a class without it is a singleton, and the word
 *           "scope" is kept for settings and IAM. Made with `createDecorator`, so it records only; gen copies it into
 *           the wiring's `lifetime` and the container falls back to it for a class the wiring does not list.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 6, 17 and 23); ADR 0143 as amended by 0263 (lifetimes).
 */
import { Enum } from "@stackra/contracts";

import { BINDING_KINDS } from "#core/constants/binding-kinds.constant";
import { createDecorator } from "#core/functions/create-decorator.function";
import type { Decorator } from "#core/types/decorator.type";

/** The lifetime codes, as an enum. */
const LIFETIMES = Enum.of({
  Singleton: "singleton",
  Request: "request",
  Transient: "transient",
});

/**
 * The lifetime facet and its codes.
 *
 * @example
 * ```ts
 * @Lifetime(Lifetime.Request)
 * export class CartService extends Service {}
 *
 * // in the generated wiring
 * { module: "orders", kind: "service", provide: CartService, lifetime: Lifetime.Request, deps: [] }
 * ```
 */
export const Lifetime: Decorator<Lifetime> & {
  /** One instance per container: the default. */
  readonly Singleton: "singleton";
  /** One instance per request, from `container.forRequest()`. */
  readonly Request: "request";
  /** A new instance on every resolution, never cached. */
  readonly Transient: "transient";
} = Object.freeze(
  Object.assign(
    createDecorator<Lifetime>({ kind: "lifetime", target: "class", kinds: BINDING_KINDS }),
    LIFETIMES,
  ),
);

/** One of the lifetimes. */
export type Lifetime = Enum.Value<typeof LIFETIMES>;
