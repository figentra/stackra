/**
 * Stackra file contract:
 * Purpose: unit tests of `NoopTracerDriver`: it is the `Tracer` port, runs the work once with a span that ignores every
 *          call, and passes results and rejections through; it continues a trace by running the work and names no
 *          `traceparent`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0266 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { NoopTracerDriver } from "#core/drivers/noop-tracer.driver";
import { Tracer } from "#core/ports/tracer.port";

describe("NoopTracerDriver", () => {
  it("is a Tracer that runs the work and records nothing", async () => {
    const tracer = new NoopTracerDriver();
    expect(tracer).toBeInstanceOf(Tracer);
    await expect(
      tracer.span("x", { a: 1 }, async (span) => {
        span.set({ b: true });
        span.fail(new Error("ignored"));
        return "done";
      }),
    ).resolves.toBe("done");
    const boom = new Error("boom");
    await expect(tracer.span("x", {}, () => Promise.reject(boom))).rejects.toBe(boom);
  });

  it("continues a trace by running the work, and names no traceparent", async () => {
    const tracer = new NoopTracerDriver();
    await expect(tracer.continueTrace({ requestId: "r1" }, async () => 7)).resolves.toBe(7);
    expect(tracer.traceparent()).toBeUndefined();
  });
});
