/**
 * Stackra file contract:
 * Purpose: `readK6Summary(summary)`, the `K6Result` of k6's `--summary-export` JSON: each metric's `thresholds` map
 *          (`true` means crossed), `http_reqs`, `http_req_failed` (its `value` is the failed share),
 *          `dropped_iterations` (absent when none dropped) and the `http_req_duration` trend.
 * Boundary: pure; a metric k6 left out (no request was sent) reads as zero.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 4: weekly k6 load tests); STA-317.
 */
import type { K6Result } from "#node/k6/k6-result.type";

/** One metric of the summary export. */
type Metric = Readonly<Record<string, unknown>> & {
  readonly thresholds?: Readonly<Record<string, boolean>>;
};

/** A number of `metric`, or 0. */
const numberOf = (metric: Metric | undefined, field: string): number => {
  const value = metric?.[field];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
};

/** Rounds `value` to three decimals. */
const round = (value: number): number => Math.round(value * 1000) / 1000;

/**
 * The result in `summary`.
 *
 * @param summary - the parsed `--summary-export` file.
 * @example
 * readK6Summary(JSON.parse(readFileSync(path, "utf8"))).duration.p95;
 */
export function readK6Summary(summary: {
  readonly metrics?: Readonly<Record<string, Metric>>;
}): K6Result {
  const metrics = summary.metrics ?? {};
  const crossed = Object.entries(metrics).flatMap(([name, metric]) =>
    Object.entries(metric.thresholds ?? {})
      .filter(([, isCrossed]) => isCrossed)
      .map(([expression]) => `${name}: ${expression}`),
  );
  const duration = metrics["http_req_duration"];
  return {
    passed: crossed.length === 0,
    crossed,
    requests: numberOf(metrics["http_reqs"], "count"),
    rate: round(numberOf(metrics["http_reqs"], "rate")),
    failedRate: numberOf(metrics["http_req_failed"], "value"),
    dropped: numberOf(metrics["dropped_iterations"], "count"),
    duration: {
      avg: round(numberOf(duration, "avg")),
      med: round(numberOf(duration, "med")),
      p90: round(numberOf(duration, "p(90)")),
      p95: round(numberOf(duration, "p(95)")),
      p99: round(numberOf(duration, "p(99)")),
      max: round(numberOf(duration, "max")),
    },
  };
}
