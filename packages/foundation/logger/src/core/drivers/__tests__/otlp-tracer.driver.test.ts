/**
 * Stackra file contract:
 * Purpose: unit tests of `OtlpTracerDriver`: it is the `Tracer` port; spans are POSTed to `<endpoint>/v1/traces` as
 *          OTLP/JSON (resource `service.name`, ids, parent, kind, nanosecond times, attributes, status, an exception
 *          event on failure); a nested span is the child of the current one; `continueTrace` joins an inbound
 *          `traceparent` (round-trip through `traceparent()`) and stamps the request id; sampling follows the ratio
 *          for a new trace and the caller's flag for a continued one; a failing collector never reaches the work.
 * Boundary: test only; `fetch` is stubbed, so nothing leaves the process. The ids are the W3C example.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0184 (decision 1); ADR 0147 (decision 3); W3C Trace Context.
 */
import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { Tracer } from "@stackra/contracts";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { OtlpConfig } from "#config/otlp.config";
import { OtlpTracerDriver } from "#core/drivers/otlp-tracer.driver";

class NoSecrets extends SecretStore {
  get(): string | undefined {
    return undefined;
  }
}

const TRACE = "4bf92f3577b34da6a3ce929d0e0e4736";
const PARENT = "00f067aa0ba902b7";

interface SentSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: number;
  startTimeUnixNano: string;
  endTimeUnixNano: string;
  attributes: { key: string; value: Record<string, unknown> }[];
  events: { name: string; attributes: { key: string; value: Record<string, unknown> }[] }[];
  status: { code: number; message?: string };
}

function tracer(values: Record<string, unknown> = {}): OtlpTracerDriver {
  return new OtlpTracerDriver(
    buildConfig(OtlpConfig, {
      values: { endpoint: "https://otlp.example.test", serviceName: "orders", ...values },
    }),
    new NoSecrets(),
  );
}

/** Every request body sent. */
function bodies(fetch: ReturnType<typeof vi.fn>): Record<string, unknown>[] {
  return fetch.mock.calls.map(
    (call) => JSON.parse(String((call[1] as RequestInit).body)) as Record<string, unknown>,
  );
}

/** Every span sent, in order. */
function spans(fetch: ReturnType<typeof vi.fn>): SentSpan[] {
  return bodies(fetch).flatMap((body) =>
    (body["resourceSpans"] as { scopeSpans: { spans: SentSpan[] }[] }[]).flatMap((resource) =>
      resource.scopeSpans.flatMap((scope) => scope.spans),
    ),
  );
}

/** A span's attributes as a plain record of their written values. */
function attributesOf(span: SentSpan | undefined): Record<string, unknown> {
  return Object.fromEntries(
    (span?.attributes ?? []).map(({ key, value }) => [key, Object.values(value)[0]]),
  );
}

let fetch: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetch = vi.fn(async () => new Response(null, { status: 200 }));
  vi.stubGlobal("fetch", fetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe(OtlpTracerDriver, () => {
  it("is a Tracer", () => {
    expect(tracer()).toBeInstanceOf(Tracer);
  });

  it("posts ended spans as OTLP JSON with the resource, times, attributes and status", async () => {
    const driver = tracer();
    await expect(
      driver.span(
        "action orders.order.create@1",
        { action: "orders.order.create@1" },
        async (span) => {
          span.set({ outcome: "ok" });
          return 42;
        },
      ),
    ).resolves.toBe(42);
    await driver.flush();
    const [url] = fetch.mock.calls[0] as [string];
    expect(url).toBe("https://otlp.example.test/v1/traces");
    const body = bodies(fetch)[0] as {
      resourceSpans: { resource: { attributes: unknown[] }; scopeSpans: { scope: unknown }[] }[];
    };
    expect(body.resourceSpans[0]?.resource.attributes).toContainEqual({
      key: "service.name",
      value: { stringValue: "orders" },
    });
    expect(body.resourceSpans[0]?.scopeSpans[0]?.scope).toEqual({ name: "@stackra/logger" });
    const [span] = spans(fetch);
    expect(span?.traceId).toMatch(/^[\da-f]{32}$/);
    expect(span?.spanId).toMatch(/^[\da-f]{16}$/);
    expect(span?.parentSpanId).toBeUndefined();
    expect(span).toMatchObject({
      name: "action orders.order.create@1",
      kind: 1,
      status: { code: 0 },
      events: [],
    });
    expect(span?.startTimeUnixNano).toMatch(/^\d+000000$/);
    expect(BigInt(span?.endTimeUnixNano ?? 0)).toBeGreaterThanOrEqual(
      BigInt(span?.startTimeUnixNano ?? 0),
    );
    expect(attributesOf(span)).toEqual({ action: "orders.order.create@1", outcome: "ok" });
  });

  it("nests a span under the current one and names it in traceparent()", async () => {
    const driver = tracer();
    let inner: string | undefined;
    await driver.span("outer", {}, () =>
      driver.span("inner", {}, async () => {
        inner = driver.traceparent();
      }),
    );
    expect(driver.traceparent()).toBeUndefined();
    await driver.flush();
    const [child, parent] = spans(fetch);
    expect(child?.name).toBe("inner");
    expect(child?.traceId).toBe(parent?.traceId);
    expect(child?.parentSpanId).toBe(parent?.spanId);
    expect(inner).toBe(`00-${child?.traceId}-${child?.spanId}-01`);
  });

  it("continues an inbound trace, read when the first span starts, and stamps the request id", async () => {
    const driver = tracer();
    const carrier: { traceparent?: string; requestId?: string } = {};
    let outbound: string | undefined;
    await driver.continueTrace(carrier, async () => {
      // A guard fills the carrier after the call began, before its first span.
      carrier.traceparent = `00-${TRACE}-${PARENT}-01`;
      carrier.requestId = "req-1";
      expect(driver.traceparent()).toBe(`00-${TRACE}-${PARENT}-01`);
      await driver.span("query orders.order.list@1", {}, () =>
        driver.span("db", {}, async () => {
          outbound = driver.traceparent();
        }),
      );
    });
    await driver.flush();
    const [inner, root] = spans(fetch);
    expect(root).toMatchObject({ traceId: TRACE, parentSpanId: PARENT, kind: 2 });
    expect(inner).toMatchObject({ traceId: TRACE, parentSpanId: root?.spanId, kind: 1 });
    expect(attributesOf(root)).toEqual({ requestId: "req-1" });
    expect(attributesOf(inner)).toEqual({ requestId: "req-1" });
    expect(outbound).toBe(`00-${TRACE}-${inner?.spanId}-01`);
  });

  it("starts a new trace when the inbound traceparent is malformed", async () => {
    const driver = tracer();
    await driver.continueTrace({ traceparent: "nonsense" }, () =>
      driver.span("x", {}, async () => 1),
    );
    await driver.flush();
    const [span] = spans(fetch);
    expect(span?.parentSpanId).toBeUndefined();
    expect(span?.kind).toBe(1);
  });

  it("samples a new trace at the ratio and follows a continued trace's flag", async () => {
    const off = tracer({ traceSampleRatio: 0 });
    let header: string | undefined;
    await off.span("dropped", {}, async () => {
      header = off.traceparent();
    });
    await off.flush();
    expect(fetch).not.toHaveBeenCalled();
    expect(header).toMatch(/^00-[\da-f]{32}-[\da-f]{16}-00$/);

    await off.continueTrace({ traceparent: `00-${TRACE}-${PARENT}-01` }, () =>
      off.span("kept", {}, async () => undefined),
    );
    const on = tracer({ traceSampleRatio: 1 });
    await on.continueTrace({ traceparent: `00-${TRACE}-${PARENT}-00` }, () =>
      on.span("unsampled", {}, async () => undefined),
    );
    await Promise.all([off.flush(), on.flush()]);
    expect(spans(fetch).map((span) => span.name)).toEqual(["kept"]);
  });

  it("marks a failed span with its error type and an exception event, and passes the rejection on", async () => {
    const driver = tracer();
    const boom = Object.assign(new Error("secret detail"), { code: "orders.out_of_stock" });
    await expect(driver.span("x", {}, () => Promise.reject(boom))).rejects.toBe(boom);
    await driver.span("y", {}, async (span) => span.fail(new TypeError("bad")));
    await driver.flush();
    const [failed, marked] = spans(fetch);
    expect(failed?.status).toEqual({ code: 2, message: "orders.out_of_stock" });
    expect(failed?.events[0]).toMatchObject({
      name: "exception",
      attributes: [{ key: "exception.type", value: { stringValue: "orders.out_of_stock" } }],
    });
    expect(JSON.stringify(failed)).not.toContain("secret detail");
    expect(marked?.status).toEqual({ code: 2, message: "TypeError" });
  });

  it("never fails the traced work when the collector fails, and counts the drop", async () => {
    fetch.mockRejectedValue(new Error("down"));
    const driver = tracer({ batchSize: 1 });
    await expect(driver.span("x", {}, async () => "done")).resolves.toBe("done");
    await expect(driver.onApplicationShutdown()).resolves.toBeUndefined();
    expect(driver.dropped).toBe(1);
  });

  it("sends nothing without an endpoint", async () => {
    const driver = tracer({ endpoint: "" });
    await driver.span("x", {}, async () => undefined);
    await driver.flush();
    expect(fetch).not.toHaveBeenCalled();
  });
});
