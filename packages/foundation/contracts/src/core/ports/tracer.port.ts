/**
 * Stackra file contract:
 * Purpose: the Tracer port: runs a unit of work inside a named span, nested under the span that is current where it is
 *          called, so the action pipeline, workers, relays and clients emit one OpenTelemetry trace per request; it
 *          continues an inbound W3C trace (`continueTrace`) and names the current span for an outbound call
 *          (`traceparent`).
 * Boundary: an abstract class that is its own token. The OTLP driver ships in @stackra/logger (`OtlpTracerDriver`, no
 *           vendor SDK, ADR 0147 decision 1); this package ships the no-op driver every host gets by default. A driver
 *           ends the span when `work` settles, marks it failed when `work` rejects, and passes the rejection on
 *           unchanged: tracing never changes what the work does. A malformed inbound `traceparent` starts a new trace.
 * Runtime: isomorphic
 * Governing contract: ADR 0147 (decisions 1 and 3); ADR 0184 (decision 1: OpenTelemetry, OTLP everywhere); ADR 0294
 *                     (decisions 16 and 17); ADR 0263 (ports resolve by type).
 */
import { Port } from "#core/bases/port.base";
import type { TraceAttributes } from "#core/types/trace-attributes.type";
import type { TraceCarrier } from "#core/types/trace-carrier.type";
import type { TraceSpan } from "#core/types/trace-span.type";

/**
 * Traces units of work.
 *
 * @example
 * return this.tracer.span("action orders.order.create@1", { action: key, actorType: actor.kind }, async (span) => {
 *   const output = await run();
 *   span.set({ outcome: "ok" });
 *   return output;
 * });
 */
export abstract class Tracer extends Port {
  /** Runs `work` in a span named `name` with `attributes`, and resolves or rejects as `work` does. */
  abstract span<T>(
    name: string,
    attributes: TraceAttributes,
    work: (span: TraceSpan) => Promise<T>,
  ): Promise<T>;

  /**
   * Runs `work` as one inbound call of the trace `carrier` names: the first span `work` opens is a child of the
   * carrier's `traceparent` (read when that span starts, so a guard may fill it first), and every span of the call
   * carries its `requestId`.
   */
  abstract continueTrace<T>(carrier: TraceCarrier, work: () => Promise<T>): Promise<T>;

  /** The W3C `traceparent` of the current span, for an outbound call's header; `undefined` outside every span. */
  abstract traceparent(): string | undefined;
}
