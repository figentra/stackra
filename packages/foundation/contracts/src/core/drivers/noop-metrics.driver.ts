/**
 * Stackra file contract:
 * Purpose: the no-op driver of the `Metrics` port (driver name `noop`): records nothing, so code that measures works
 *          the same where no telemetry runtime is bound (tests, local dev, a single process).
 * Boundary: a plain subclass of the port: this package sits below @stackra/container, so it cannot use the `Driver()`
 *           base; a host's wiring lists it as a candidate like any driver class.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (decision 2: a memory driver first); ADR 0184 (decision 1).
 */
import { Metrics } from "#core/ports/metrics.port";
import type { TraceAttributes } from "#core/types/trace-attributes.type";

/**
 * Metrics that go nowhere.
 *
 * @example
 * new NoopMetricsDriver().counter("orders.created", 1);
 */
export class NoopMetricsDriver extends Metrics {
  /** Records nothing. */
  counter(_name: string, _value: number, _attributes?: TraceAttributes): void {
    return undefined;
  }

  /** Records nothing. */
  histogram(_name: string, _value: number, _attributes?: TraceAttributes): void {
    return undefined;
  }

  /** Records nothing. */
  gauge(_name: string, _value: number, _attributes?: TraceAttributes): void {
    return undefined;
  }
}
