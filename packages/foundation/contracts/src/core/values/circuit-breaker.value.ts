/**
 * Stackra file contract:
 * Purpose: `CircuitBreaker`, the guard of one dependency that keeps failing: `failureThreshold` failed calls in a row
 *          open the circuit, an open circuit refuses every call at once for `cooldownMs`, then half opens and lets
 *          `halfOpenProbes` trial calls through; a trial that works closes it, one that fails reopens it for another
 *          cooldown. A dependency that is down or slow is then refused in microseconds instead of holding every caller
 *          for its timeout, and it gets room to recover.
 * Boundary: in process and in memory, one per dependency (the integrations runtime keeps one per Integration and
 *           origin); it never calls anything and never throws while running: `admit(now)` returns a `CircuitTicket`
 *           or `undefined`, and the caller raises its own refusal with `retryAfterMs(now)`. Time is passed in as epoch
 *           milliseconds (from the `Clock` port), so it is deterministic under test. A call admitted while closed
 *           that fails after the circuit opened does not extend the cooldown, and its late success does not close it;
 *           an outcome reported twice counts once.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 13: the managed client turns a provider outcome into a value or a refusal); ADR
 *                     0140 (an open circuit is an `Unavailable` refusal of the caller); STA-1467.
 */
import { CircuitState } from "#core/enums/circuit-state.enum";
import type { CircuitBreakerOptions } from "#core/types/circuit-breaker-options.type";
import type { CircuitTicket } from "#core/types/circuit-ticket.type";

/**
 * A circuit breaker of one dependency.
 *
 * @example
 * const breaker = new CircuitBreaker({ failureThreshold: 5, cooldownMs: 30_000 });
 * const ticket = breaker.admit(Date.now());
 * if (ticket === undefined)
 *   throw ProviderUnavailableError.create({ provider, retryAfterMs: breaker.retryAfterMs(Date.now()) });
 */
export class CircuitBreaker {
  /** How many failed calls in a row open the circuit. */
  readonly failureThreshold: number;

  /** How long an open circuit refuses calls, in milliseconds. */
  readonly cooldownMs: number;

  /** How many trial calls go at once while half open. */
  readonly halfOpenProbes: number;

  /** The failed calls in a row while closed. */
  private failures = 0;

  /** When the circuit last opened (epoch milliseconds), or undefined while closed. */
  private openedAt: number | undefined;

  /** The trial calls in flight while half open. */
  private probes = 0;

  /**
   * @throws RangeError when `failureThreshold` or `halfOpenProbes` is not a whole number from 1, or `cooldownMs` is not
   *         a finite number above 0.
   */
  constructor(options: CircuitBreakerOptions) {
    const { failureThreshold, cooldownMs, halfOpenProbes = 1 } = options;
    if (!Number.isInteger(failureThreshold) || failureThreshold < 1)
      throw new RangeError(`a circuit opens after at least one failure, got ${failureThreshold}`);
    if (!(cooldownMs > 0) || !Number.isFinite(cooldownMs))
      throw new RangeError(`a circuit stays open for a cooldown above 0 ms, got ${cooldownMs}`);
    if (!Number.isInteger(halfOpenProbes) || halfOpenProbes < 1)
      throw new RangeError(
        `a half-open circuit lets at least one trial call through, got ${halfOpenProbes}`,
      );
    this.failureThreshold = failureThreshold;
    this.cooldownMs = cooldownMs;
    this.halfOpenProbes = halfOpenProbes;
  }

  /** Where the circuit stands at `now` (epoch milliseconds). */
  state(now: number): CircuitState {
    if (this.openedAt === undefined) return CircuitState.Closed;
    return now - this.openedAt >= this.cooldownMs ? CircuitState.HalfOpen : CircuitState.Open;
  }

  /** How long, in milliseconds, until the circuit may let a call through at `now`: 0 when one may go now. */
  retryAfterMs(now: number): number {
    if (this.openedAt === undefined) return 0;
    const open = this.cooldownMs - (now - this.openedAt);
    if (open > 0) return open;
    // Half open with every trial place taken: the trials settle within their own timeout, so ask again a cooldown on.
    return this.probes < this.halfOpenProbes ? 0 : this.cooldownMs;
  }

  /** Lets one call through at `now` (epoch milliseconds), or refuses it (`undefined`) while open or its trials run. */
  admit(now: number): CircuitTicket | undefined {
    const state = this.state(now);
    if (state === CircuitState.Closed) return this.ticket(false);
    if (state === CircuitState.Open || this.probes >= this.halfOpenProbes) return undefined;
    this.probes += 1;
    return this.ticket(true);
  }

  /** The ticket of one admitted call; only its first report counts. */
  private ticket(probe: boolean): CircuitTicket {
    let settled = false;
    const settle = (): boolean => {
      if (settled) return false;
      settled = true;
      if (probe) this.probes -= 1;
      return true;
    };
    return {
      probe,
      succeed: () => {
        if (!settle()) return;
        // A late success of a call admitted while closed does not close an open circuit; a trial's does.
        if (probe || this.openedAt === undefined) {
          this.failures = 0;
          this.openedAt = undefined;
        }
      },
      fail: (now) => {
        if (!settle()) return;
        if (probe) {
          this.openedAt = now;
          return;
        }
        if (this.openedAt !== undefined) return;
        this.failures += 1;
        if (this.failures >= this.failureThreshold) {
          this.failures = 0;
          this.openedAt = now;
        }
      },
      release: () => {
        settle();
      },
    };
  }
}
