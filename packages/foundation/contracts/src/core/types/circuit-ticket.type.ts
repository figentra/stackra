/**
 * Stackra file contract:
 * Purpose: `CircuitTicket`, what `CircuitBreaker#admit` hands a call it lets through: the call reports its outcome on
 *          it exactly once, so the breaker counts the failure, closes on a trial call that worked, or frees the trial
 *          place of a call whose outcome says nothing about the dependency (a rate limit, the caller giving up).
 * Boundary: a type only. The first report wins; a later one does nothing, so a `finally` may call `release` safely.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 13); STA-1467.
 */

/**
 * One admitted call.
 *
 * @example
 * const ticket = breaker.admit(now);
 * if (ticket === undefined) throw ProviderUnavailableError.create({ provider, retryAfterMs: breaker.retryAfterMs(now) });
 * try { const answer = await send(); ticket.succeed(); return answer; } catch (error) { ticket.fail(clock.now().getTime()); throw error; }
 */
export interface CircuitTicket {
  /** Whether this call is a trial call of a half-open circuit. */
  readonly probe: boolean;

  /** The dependency answered: resets the failure count and closes a half-open circuit. */
  succeed: () => void;

  /** The dependency failed (no answer, a timeout, a 5xx) at `now` (milliseconds): counts it, and may open the circuit. */
  fail: (now: number) => void;

  /** The outcome says nothing about the dependency: frees a trial place without counting anything. */
  release: () => void;
}
