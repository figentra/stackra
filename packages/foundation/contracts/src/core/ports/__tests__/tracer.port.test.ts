/**
 * Stackra file contract:
 * Purpose: unit tests of the `Tracer` port: a port an implementation extends, whose span runs the work, passes its
 *          result and its rejection through unchanged, and lets the work set attributes and record a failure.
 * Boundary: test only; a recording tracer stands in for the OTLP driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0147 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { Port } from "#core/bases/port.base";
import { Tracer } from "#core/ports/tracer.port";
import type { TraceAttributes } from "#core/types/trace-attributes.type";
import type { TraceSpan } from "#core/types/trace-span.type";

class RecordingTracer extends Tracer {
  readonly spans: { name: string; attributes: Record<string, unknown>; failed: boolean }[] = [];

  async span<T>(
    name: string,
    attributes: TraceAttributes,
    work: (span: TraceSpan) => Promise<T>,
  ): Promise<T> {
    const span = { name, attributes: { ...attributes }, failed: false };
    this.spans.push(span);
    try {
      return await work({
        set: (more) => Object.assign(span.attributes, more),
        fail: () => {
          span.failed = true;
        },
      });
    } catch (error) {
      span.failed = true;
      throw error;
    }
  }
}

describe("Tracer", () => {
  it("is a port an implementation extends", () => {
    expect(new RecordingTracer()).toBeInstanceOf(Tracer);
    expect(Object.getPrototypeOf(Tracer)).toBe(Port);
  });

  it("runs the work in a span and passes results and rejections through", async () => {
    const tracer = new RecordingTracer();
    await expect(
      tracer.span("action", { action: "orders.order.create@1" }, async (span) => {
        span.set({ outcome: "ok" });
        return 42;
      }),
    ).resolves.toBe(42);
    const boom = new Error("boom");
    await expect(tracer.span("job", {}, () => Promise.reject(boom))).rejects.toBe(boom);
    expect(tracer.spans).toEqual([
      {
        name: "action",
        attributes: { action: "orders.order.create@1", outcome: "ok" },
        failed: false,
      },
      { name: "job", attributes: {}, failed: true },
    ]);
  });
});
