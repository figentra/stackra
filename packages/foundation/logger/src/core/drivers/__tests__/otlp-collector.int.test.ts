/**
 * Stackra file contract:
 * Purpose: the end-to-end proof of the three OTLP drivers against a real OpenTelemetry Collector (ADR 0184 decision
 *          1): the log reporter, the tracer and the metrics driver POST their OTLP/JSON to the collector's OTLP/HTTP
 *          receiver behind basic auth, with the header taken from the headers secret, and the collector accepts and
 *          re-exports each signal with its `service.name`, attributes, trace ids, severities, monotonic sums,
 *          histogram buckets and gauges intact, and the HTTP server histogram keeps its unit (`s`) and the advised
 *          seconds bounds. A wrong secret is refused (401): the batch is dropped and counted, and nothing reaches the
 *          export.
 * Boundary: integration tier (`.int`): needs Docker (`startCollector`, Testcontainers) or the collector binary
 *           (`STACKRA_OTELCOL_BIN`, the same pinned release). One collector for the file;
 *           every test uses its own service name, so the tests read only their own exports.
 * Runtime: node (vitest)
 * Governing contract: ADR 0184 (decisions 1, 2 and 5); ADR 0147 (decision 1: the OTLP driver); ADR 0173 (secrets by
 *                     name); ADR 0182 (integration tier).
 */
import { setTimeout as sleep } from "node:timers/promises";

import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { HTTP_SERVER_DURATION } from "@stackra/contracts";
import { afterAll, beforeAll, describe, expect, it } from "@stackra/testing";

import { OtlpConfig } from "#config/otlp.config";
import { LogLevel } from "#contracts/enums/log-level.enum";
import { startCollector } from "#core/drivers/__tests__/fixtures/otel-collector.fixture";
import type { Collector } from "#core/drivers/__tests__/fixtures/otel-collector.fixture";
import { OtlpLogReporterDriver } from "#core/drivers/otlp-log-reporter.driver";
import { OtlpMetricsDriver } from "#core/drivers/otlp-metrics.driver";
import { OtlpTracerDriver } from "#core/drivers/otlp-tracer.driver";

/** The headers secret, as the deployment's secret store holds it (`k=v`, URL-encoded). */
class HeaderSecrets extends SecretStore {
  constructor(private readonly headers: string) {
    super();
  }

  get(name: string): string | undefined {
    return name === "OTEL_EXPORTER_OTLP_HEADERS" ? this.headers : undefined;
  }
}

/** One OTLP/JSON key-value attribute, as the collector writes it. */
interface Attribute {
  readonly key: string;
  readonly value: Readonly<Record<string, unknown>>;
}

/** An export line's resource-level entries for `signal` (`resourceLogs`, `resourceSpans`, `resourceMetrics`). */
type Resource = {
  readonly resource: { readonly attributes: readonly Attribute[] };
} & Readonly<Record<string, unknown>>;

let collector: Collector;

beforeAll(async () => {
  collector = await startCollector();
}, 300_000);

afterAll(async () => {
  await collector?.stop();
});

/** The `authorization` header for `password`, in the OpenTelemetry headers form the drivers read. */
function basic(password: string): string {
  const token = Buffer.from(`${collector.user}:${password}`).toString("base64");
  return `authorization=${encodeURIComponent(`Basic ${token}`)}`;
}

/** The drivers' configuration for `serviceName`, sending to the collector. */
function config(serviceName: string): OtlpConfig {
  return buildConfig(OtlpConfig, {
    values: { endpoint: collector.endpoint, serviceName, flushIntervalMs: 100 },
  });
}

/** The value of attribute `key`, or `undefined`. */
function attribute(attributes: readonly Attribute[], key: string): unknown {
  return attributes.find((entry) => entry.key === key)?.value;
}

/** The resources of `signal` the collector exported for `serviceName`, polled until `ready` holds or 10 s pass. */
async function exportedFor(
  signal: "resourceLogs" | "resourceSpans" | "resourceMetrics",
  serviceName: string,
  ready: (resources: readonly Resource[]) => boolean = (resources) => resources.length > 0,
): Promise<readonly Resource[]> {
  const deadline = Date.now() + 10_000;
  for (;;) {
    const resources = (await collector.exported())
      .flatMap((line) => (line[signal] ?? []) as readonly Resource[])
      .filter(
        (resource) =>
          (attribute(resource.resource.attributes, "service.name") as { stringValue?: string })
            ?.stringValue === serviceName,
      );
    if (ready(resources) || Date.now() > deadline) return resources;
    await sleep(200);
  }
}

describe("the OTLP drivers against a real collector", () => {
  it("delivers log records with their severity, channel and typed fields", async () => {
    const reporter = new OtlpLogReporterDriver(
      config("proof-logs"),
      new HeaderSecrets(basic(collector.password)),
    );
    reporter.report({
      time: "2026-11-26T09:00:00.000Z",
      level: LogLevel.Warn,
      event: "orders.draft_priced",
      channel: "orders",
      fields: { lines: 3, total: 12.5, paid: false, ids: ["a", "b"], scope: { region: "eu" } },
    });
    await reporter.flush();
    expect(reporter.dropped).toBe(0);

    const [resource] = await exportedFor("resourceLogs", "proof-logs");
    const scopeLogs = resource?.["scopeLogs"] as readonly {
      scope: { name: string };
      logRecords: readonly {
        timeUnixNano: string;
        severityNumber: number;
        severityText: string;
        body: { stringValue: string };
        attributes: readonly Attribute[];
      }[];
    }[];
    expect(scopeLogs[0]?.scope.name).toBe("@stackra/logger");
    const [log] = scopeLogs[0]?.logRecords ?? [];
    expect(log).toMatchObject({
      timeUnixNano: "1795683600000000000",
      severityNumber: 13,
      severityText: "WARN",
      body: { stringValue: "orders.draft_priced" },
    });
    const attributes = log?.attributes ?? [];
    expect(attribute(attributes, "log.channel")).toEqual({ stringValue: "orders" });
    expect(attribute(attributes, "lines")).toEqual({ intValue: "3" });
    expect(attribute(attributes, "total")).toEqual({ doubleValue: 12.5 });
    expect(attribute(attributes, "paid")).toEqual({ boolValue: false });
    expect(attribute(attributes, "ids")).toEqual({
      arrayValue: { values: [{ stringValue: "a" }, { stringValue: "b" }] },
    });
    expect(attribute(attributes, "scope")).toEqual({
      kvlistValue: { values: [{ key: "region", value: { stringValue: "eu" } }] },
    });
  });

  it("delivers a server span continuing the caller's trace, its child and the failure", async () => {
    const tracer = new OtlpTracerDriver(
      config("proof-traces"),
      new HeaderSecrets(basic(collector.password)),
    );
    const traceId = "4bf92f3577b34da6a3ce929d0e0e4736";
    const callerSpanId = "00f067aa0ba902b7";
    await expect(
      tracer.continueTrace(
        { traceparent: `00-${traceId}-${callerSpanId}-01`, requestId: "req_01" },
        () =>
          tracer.span("POST /orders", { route: "/orders" }, async () =>
            tracer.span("action orders.order.create@1", { attempt: 1 }, async () => {
              throw Object.assign(new Error("no stock"), { code: "out_of_stock" });
            }),
          ),
      ),
    ).rejects.toThrow("no stock");
    await tracer.flush();
    expect(tracer.dropped).toBe(0);

    const resources = await exportedFor(
      "resourceSpans",
      "proof-traces",
      (found) => found.flatMap((r) => r["scopeSpans"] as unknown[]).length >= 1,
    );
    const spans = resources.flatMap((resource) =>
      (
        resource["scopeSpans"] as readonly {
          spans: readonly {
            traceId: string;
            spanId: string;
            parentSpanId?: string;
            name: string;
            kind: number;
            attributes: readonly Attribute[];
            status: { code?: number; message?: string };
            events?: readonly { name: string }[];
          }[];
        }[]
      ).flatMap((scope) => scope.spans),
    );
    const server = spans.find((span) => span.name === "POST /orders");
    const action = spans.find((span) => span.name === "action orders.order.create@1");
    expect(server).toMatchObject({ traceId, parentSpanId: callerSpanId, kind: 2 });
    expect(attribute(server?.attributes ?? [], "requestId")).toEqual({ stringValue: "req_01" });
    expect(action).toMatchObject({ traceId, parentSpanId: server?.spanId, kind: 1 });
    expect(action?.status).toEqual({ code: 2, message: "out_of_stock" });
    expect(action?.events?.map((event) => event.name)).toEqual(["exception"]);
    expect(server?.status).toEqual({ code: 2, message: "out_of_stock" });
  });

  it("delivers a monotonic sum, an explicit-bucket histogram and a gauge", async () => {
    const metrics = new OtlpMetricsDriver(
      config("proof-metrics"),
      new HeaderSecrets(basic(collector.password)),
    );
    metrics.counter("orders.created", 2, { region: "eu" });
    metrics.counter("orders.created", 3, { region: "eu" });
    metrics.histogram("orders.create.duration_ms", 42, { outcome: "ok" });
    metrics.histogram("orders.create.duration_ms", 600, { outcome: "ok" });
    metrics.gauge("orders.queue.depth", 7);
    await metrics.flush();
    await metrics.onApplicationShutdown();
    expect(metrics.dropped).toBe(0);

    const resources = await exportedFor("resourceMetrics", "proof-metrics");
    const all = resources.flatMap((resource) =>
      (
        resource["scopeMetrics"] as readonly {
          metrics: readonly ({ name: string } & Readonly<Record<string, unknown>>)[];
        }[]
      ).flatMap((scope) => scope.metrics),
    );
    const byName = (name: string) => all.find((metric) => metric.name === name);

    const created = byName("orders.created")?.["sum"] as {
      aggregationTemporality: number;
      isMonotonic: boolean;
      dataPoints: readonly { asDouble: number; attributes: readonly Attribute[] }[];
    };
    expect(created).toMatchObject({ aggregationTemporality: 2, isMonotonic: true });
    expect(created.dataPoints[0]?.asDouble).toBe(5);
    expect(attribute(created.dataPoints[0]?.attributes ?? [], "region")).toEqual({
      stringValue: "eu",
    });

    const duration = byName("orders.create.duration_ms")?.["histogram"] as {
      aggregationTemporality: number;
      dataPoints: readonly {
        count: string;
        sum: number;
        min: number;
        max: number;
        explicitBounds: readonly number[];
        bucketCounts: readonly string[];
      }[];
    };
    expect(duration.aggregationTemporality).toBe(2);
    const point = duration.dataPoints[0];
    expect(point).toMatchObject({ count: "2", sum: 642, min: 42, max: 600 });
    expect(point?.bucketCounts.length).toBe((point?.explicitBounds.length ?? 0) + 1);
    expect(point?.bucketCounts.reduce((total, count) => total + Number(count), 0)).toBe(2);

    const depth = byName("orders.queue.depth")?.["gauge"] as {
      dataPoints: readonly { asDouble: number }[];
    };
    expect(depth.dataPoints[0]?.asDouble).toBe(7);
  });

  it("delivers the HTTP server histogram in seconds, with its unit and the advised bounds", async () => {
    const metrics = new OtlpMetricsDriver(
      config("proof-http"),
      new HeaderSecrets(basic(collector.password)),
    );
    const { name, unit, bounds } = HTTP_SERVER_DURATION;
    const attributes = {
      "http.request.method": "POST",
      "http.route": "/orders/:orderId",
      "http.response.status_code": 200,
    };
    metrics.histogram(name, 0.02, attributes, { unit, bounds });
    metrics.histogram(name, 0.3, attributes, { unit, bounds });
    await metrics.onApplicationShutdown();
    expect(metrics.dropped).toBe(0);

    const resources = await exportedFor("resourceMetrics", "proof-http");
    const metric = resources
      .flatMap((resource) =>
        (
          resource["scopeMetrics"] as readonly {
            metrics: readonly ({ name: string; unit?: string } & Readonly<
              Record<string, unknown>
            >)[];
          }[]
        ).flatMap((scope) => scope.metrics),
      )
      .find((candidate) => candidate.name === name);
    expect(metric?.unit).toBe("s");
    const histogram = metric?.["histogram"] as
      | {
          dataPoints: readonly {
            count: string;
            explicitBounds: readonly number[];
            bucketCounts: readonly string[];
            attributes: readonly Attribute[];
          }[];
        }
      | undefined;
    const point = histogram?.dataPoints[0];
    expect(point?.explicitBounds).toEqual([...bounds]);
    expect(point?.count).toBe("2");
    expect(point?.bucketCounts[bounds.indexOf(0.025)]).toBe("1");
    expect(point?.bucketCounts[bounds.indexOf(0.5)]).toBe("1");
    expect(attribute(point?.attributes ?? [], "http.route")).toEqual({
      stringValue: "/orders/:orderId",
    });
    expect(attribute(point?.attributes ?? [], "http.response.status_code")).toEqual({
      intValue: "200",
    });
  });

  it("drops and counts a batch the collector refuses for a wrong secret", async () => {
    const reporter = new OtlpLogReporterDriver(
      config("proof-refused"),
      new HeaderSecrets(basic("not-the-password")),
    );
    reporter.report({
      time: "2026-11-26T09:00:00.000Z",
      level: LogLevel.Info,
      event: "orders.refused",
      channel: "orders",
      fields: {},
    });
    await reporter.flush();
    expect(reporter.dropped).toBe(1);
    // Give the collector a moment: nothing of this service may reach the export.
    await sleep(500);
    expect(await exportedFor("resourceLogs", "proof-refused", () => true)).toEqual([]);
  });
});
