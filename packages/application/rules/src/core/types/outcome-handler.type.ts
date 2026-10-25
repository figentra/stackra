/**
 * Stackra file contract:
 * Purpose: `OutcomeHandler<C, R>`, the consumer's function that applies one outcome kind: it takes the guarded
 *          parameters and the consumer's own context, and returns what applying it gave.
 * Boundary: a type only. The consumer writes it (a discount applies an amount, an order hold records its reason); the
 *           engine never applies an outcome (ADR 0331 decision 9). `C` is whatever the consumer needs (a cart, an
 *           action context), `R` what it collects.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decision 9).
 */
import type { Json } from "@stackra/contracts";

/** Applies one outcome kind. */
export type OutcomeHandler<C, R> = (
  params: Readonly<Record<string, Json>>,
  context: C,
) => R | Promise<R>;
