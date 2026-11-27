/**
 * Stackra file contract:
 * Purpose: `CircuitBreakerOptions`, what `new CircuitBreaker(...)` takes: how many failures in a row open the circuit,
 *          how long it stays open, and how many trial calls go at once once it half opens.
 * Boundary: a type only; the constructor checks the numbers (`RangeError`).
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 13); STA-1467.
 */

/**
 * The options of a circuit breaker.
 *
 * @example
 * const options: CircuitBreakerOptions = { failureThreshold: 5, cooldownMs: 30_000 };
 */
export interface CircuitBreakerOptions {
  /** How many failed calls in a row open the circuit; a whole number from 1. */
  readonly failureThreshold: number;

  /** How long an open circuit refuses calls before it lets a trial call through, in milliseconds (above 0). */
  readonly cooldownMs: number;

  /** How many trial calls go at once while half open; 1 when left out. */
  readonly halfOpenProbes?: number;
}
