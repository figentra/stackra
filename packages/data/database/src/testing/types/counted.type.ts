/**
 * Stackra file contract:
 * Purpose: `Counted<F, M>`, what `factory.count(n)` returns: the same factory, whose `make` and `create` give `n`
 *          rows instead of one.
 * Boundary: a type only; the value is the factory itself. Call `count` last in a chain: a state method called after
 *           it gives back the single-row type.
 * Runtime: node
 * Governing contract: ADR 0190 (factories).
 */
import type { Attributes } from "@stackra/model";

/** A factory of `n` rows of `M`. */
export type Counted<F, M> = Omit<F, "make" | "create"> & {
  /** `n` unsaved rows. */
  make(overrides?: Attributes<M>): M[];

  /** `n` saved rows. */
  create(overrides?: Attributes<M>): Promise<M[]>;
};
