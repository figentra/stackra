/**
 * Stackra file contract:
 * Purpose: `AnyClass<I>`, any class whose instances are `I`, abstract or not, whatever its constructor takes: the
 *          type of a token, a binding, a kind base and a class reference inside kind options.
 * Boundary: a type only. The parameters are `never[]`, so a class with injected constructor parameters still fits
 *           (a zero-argument constructor type would refuse it, kind-base spike gotcha 2).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 25: a class reference is typed `abstract new (...args) => XBase`).
 */

/**
 * A class of instances `I`.
 *
 * @example
 * function nameOf(token: AnyClass): string {
 *   return token.name;
 * }
 */
export type AnyClass<I extends object = object> = abstract new (...args: never[]) => I;
