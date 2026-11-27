/**
 * Stackra file contract:
 * Purpose: `CircuitState`, where a `CircuitBreaker` stands: closed (calls go), open (calls are refused at once until the
 *          cooldown passes) or half open (a few trial calls go; their outcome closes or reopens it).
 * Boundary: an `Enum.of` value plus the type of the same name; `CircuitBreaker#state(now)` reads it.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 13: the managed client turns a provider outcome into a value or a refusal); ADR
 *                     0140 (an open circuit is an `Unavailable` refusal); STA-1467.
 */
import { Enum } from "#core/bases/enum.base";

/**
 * The state of a circuit breaker.
 *
 * @example
 * if (breaker.state(Date.now()) === CircuitState.Open) return cachedAnswer;
 */
export const CircuitState = Enum.of({
  /** Calls go; consecutive failures are counted. */
  Closed: "closed",
  /** Calls are refused at once until the cooldown passes. */
  Open: "open",
  /** The cooldown passed: a few trial calls go, and their outcome closes or reopens the circuit. */
  HalfOpen: "half_open",
});

/** One of the codes above. */
export type CircuitState = Enum.Value<typeof CircuitState>;
