/**
 * Stackra file contract:
 * Purpose: `FinishedSpan`, a span the OTLP tracer has ended and queued: its context, its parent, its kind, its times,
 *          its attributes and, when it failed, the error's type.
 * Boundary: a type only. Times are unix milliseconds (the encoder writes nanoseconds). Attributes are the span's
 *           `TraceAttributes`: ids and codes, never values.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decision 1); ADR 0147 (decision 3).
 */
import type { TraceAttributes } from "@stackra/contracts";

import type { SpanContext } from "#core/types/span-context.type";

/** One ended span. */
export interface FinishedSpan {
  /** The span's operation name, as the tracer started it. */
  readonly name: string;

  /** The span's trace id and span id. */
  readonly context: SpanContext;

  /** The parent's span id; none for a trace's root. */
  readonly parentSpanId?: string;

  /** `server` for the first span of a continued inbound trace, else `internal`. */
  readonly kind: "server" | "internal";

  /** When the span started, in epoch milliseconds. */
  readonly startMs: number;

  /** When the span ended, in epoch milliseconds. */
  readonly endMs: number;

  /** The attributes recorded on the span. */
  readonly attributes: TraceAttributes;

  /** The failed error's type (its `code`, else its class name); none when the span succeeded. */
  readonly error?: string;
}
