/**
 * Stackra file contract:
 * Purpose: `InlineExtension`, an implementer of one slot given as a function instead of a class: what the testing
 *          helper `extension(Point, "slot", { order }, handle)` builds and `connectExtensions` accepts beside the
 *          registered classes.
 * Boundary: a type only. Inline implementers belong to one connected app (a testing module), never to the registry.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 23 and 25); ADR 0269 (testing helpers in `./testing`).
 */
import type { AnyClass } from "@stackra/container";

import type { ExtensionPoint } from "#core/bases/extension-point.base";

/** A function implementer of one slot. */
export interface InlineExtension {
  /** The point class that declares the slot. */
  readonly point: AnyClass<ExtensionPoint>;

  /** The slot's property name on the point. */
  readonly slot: string;

  /** Its place in the chain, ascending. */
  readonly order: number;

  /** The implementer, called like an extension's `handle`. */
  readonly handle: (...args: never[]) => unknown;
}
