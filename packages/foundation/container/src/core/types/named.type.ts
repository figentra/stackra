/**
 * Stackra file contract:
 * Purpose: `Named<P, N>`, the constructor parameter type that asks for the instance of port `P` that config names
 *          `N`, when two instances of one port live in a container (a driver migration).
 * Boundary: a type only, with a type-only brand; gen reads it from the parameter type and prints `named(P, "x")` in
 *           the wiring. The default instance still comes by the bare port type.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 17); ADR 0263 (decision 4).
 */
import type { Port } from "@stackra/contracts";

/**
 * The instance of `P` named `N`.
 *
 * @example
 * constructor(primary: Named<LoyaltyLedger, "primary">, current: LoyaltyLedger) {
 *   super();
 * }
 */
export type Named<P extends Port, N extends string> = P & { readonly "~named": N };
