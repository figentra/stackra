/**
 * Stackra file contract:
 * Purpose: `HTTP_DURATION_BOUNDS`, the explicit bucket bounds (seconds) the OpenTelemetry HTTP semantic conventions
 *          advise for `http.server.request.duration`. A latency objective's threshold must be one of them: a histogram
 *          counts the requests at or under a bucket bound (`le`), so only a bound can split good requests from slow
 *          ones without guessing inside a bucket.
 * Boundary: internal data; `observabilityPlan` checks `slos.objectives.*.latency.thresholdMs` against it.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decisions 1 and 3); OpenTelemetry semantic conventions (HTTP metrics).
 */

/** The advised bounds of the HTTP server duration histogram, in seconds. */
export const HTTP_DURATION_BOUNDS: readonly number[] = [
  0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1, 2.5, 5, 7.5, 10,
];
