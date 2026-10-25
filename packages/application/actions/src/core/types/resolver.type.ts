/**
 * Stackra file contract:
 * Purpose: `Resolver`, what the pipeline and the extension slots read classes from: anything that says whether it binds
 *          a class and returns its instance (the booted `Container`, a request container, a `TestingApp`).
 * Boundary: a type only, so this package never needs the container instance itself; the same shape `EventBus.connect`
 *           takes. Optional collaborators (a step's port nobody bound) are read with `has` first.
 * Runtime: isomorphic
 * Governing contract: ADR 0263 (classes are the only tokens); ADR 0294 (decision 17).
 */
import type { AnyClass } from "@stackra/container";

/** Reads instances by class. */
export interface Resolver {
  /** Whether `token` is bound. */
  has(token: AnyClass): boolean;

  /** The instance bound to `token`. */
  get<T extends object>(token: AnyClass<T>): T;
}
