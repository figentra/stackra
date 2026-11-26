/**
 * Stackra file contract:
 * Purpose: `fakeCollector()`, the "Observability" guide's stand-in OpenTelemetry collector: a `fetch` double that
 *          accepts OTLP/JSON posts and reads back the span names and attributes, the metric names with their summed
 *          counter values, and the log lines with their fields, as a collector would store them.
 * Boundary: test support only; it reads the OTLP/JSON shapes the logger package's drivers send and answers 200.
 * Runtime: node (vitest)
 * Governing contract: ADR 0184 (decision 1: one OTLP collector for the three signals); STA-2852.
 */
import { vi } from "vitest";

/** One OTLP attribute as sent. */
interface OtlpAttribute {
  readonly key: string;
  readonly value: Readonly<Record<string, unknown>>;
}

/** The attributes as a plain record of their sent values. */
const plain = (attributes: readonly OtlpAttribute[] = []): Record<string, unknown> =>
  Object.fromEntries(attributes.map(({ key, value }) => [key, Object.values(value)[0]]));

/**
 * A collector double and readers of what it received.
 *
 * @example
 * const collector = fakeCollector();
 * vi.stubGlobal("fetch", collector.fetch);
 */
export function fakeCollector() {
  const posts: { path: string; body: Record<string, unknown> }[] = [];
  const fetch = vi.fn(async (url: string | URL, init?: RequestInit) => {
    posts.push({ path: new URL(url).pathname, body: JSON.parse(String(init?.body)) });
    return new Response(null, { status: 200 });
  });
  const bodies = (path: string) =>
    posts.filter((post) => post.path === path).map((post) => post.body);
  return {
    fetch,
    /** Every span received: its name and attributes. */
    spans: () =>
      bodies("/v1/traces").flatMap((body) =>
        (
          body["resourceSpans"] as {
            scopeSpans: { spans: { name: string; attributes: OtlpAttribute[] }[] }[];
          }[]
        )
          .flatMap((resource) => resource.scopeSpans.flatMap((scope) => scope.spans))
          .map((span) => ({ name: span.name, attributes: plain(span.attributes) })),
      ),
    /** Every metric name received, with the sum of its counter points (0 for a histogram). */
    metrics: () => {
      const totals = new Map<string, number>();
      for (const body of bodies("/v1/metrics"))
        for (const resource of body["resourceMetrics"] as {
          scopeMetrics: {
            metrics: { name: string; sum?: { dataPoints: { asDouble: number }[] } }[];
          }[];
        }[])
          for (const scope of resource.scopeMetrics)
            for (const metric of scope.metrics)
              totals.set(
                metric.name,
                (metric.sum?.dataPoints ?? []).reduce((total, point) => total + point.asDouble, 0),
              );
      return Object.fromEntries(totals);
    },
    /** Every log line received: its event and fields. */
    logs: () =>
      bodies("/v1/logs").flatMap((body) =>
        (
          body["resourceLogs"] as {
            scopeLogs: {
              logRecords: { body: { stringValue: string }; attributes: OtlpAttribute[] }[];
            }[];
          }[]
        )
          .flatMap((resource) => resource.scopeLogs.flatMap((scope) => scope.logRecords))
          .map((record) => ({ event: record.body.stringValue, fields: plain(record.attributes) })),
      ),
  };
}
