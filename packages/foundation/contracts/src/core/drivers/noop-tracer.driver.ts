/**
 * Stackra file contract:
 * Purpose: the no-op driver of the `Tracer` port (driver name `noop`): runs the work and records nothing, so code that
 *          traces works the same where no telemetry runtime is bound (tests, local dev, a single process).
 * Boundary: a plain subclass of the port: this package sits below @stackra/container, so it cannot use the `Driver()`
 *           base; a host's wiring lists it as a candidate like any driver class. The span it hands out ignores every
 *           call; it continues no trace and names no `traceparent`.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (decision 2: a memory driver first); ADR 0147 (decision 1).
 */
import { Tracer } from "#core/ports/tracer.port";
import type { TraceAttributes } from "#core/types/trace-attributes.type";
import type { TraceCarrier } from "#core/types/trace-carrier.type";
import type { TraceSpan } from "#core/types/trace-span.type";

/** The span every call gets. */
const SPAN: TraceSpan = Object.freeze({
  set: () => undefined,
  fail: () => undefined,
});

/**
 * A tracer that records nothing.
 *
 * @example
 * await new NoopTracerDriver().span("job", {}, async () => run());
 */
export class NoopTracerDriver extends Tracer {
  /** Runs `work` with a span that records nothing. */
  span<T>(
    _name: string,
    _attributes: TraceAttributes,
    work: (span: TraceSpan) => Promise<T>,
  ): Promise<T> {
    return work(SPAN);
  }

  /** Runs `work`; the carrier is ignored. */
  continueTrace<T>(_carrier: TraceCarrier, work: () => Promise<T>): Promise<T> {
    return work();
  }

  /** No span is ever current. */
  traceparent(): string | undefined {
    return undefined;
  }
}
