/**
 * Stackra file contract:
 * Purpose: `HTTP_SERVER_DURATION`, the stable OpenTelemetry HTTP server histogram every served request is recorded in:
 *          its name (`http.server.request.duration`), its unit (seconds) and the bucket bounds the HTTP semantic
 *          conventions advise. The server runtime records it; the service-level objectives read it, so a latency
 *          threshold must be one of these bounds.
 * Boundary: a frozen constant. The attributes are `http.request.method`, `http.route` (the route template, never the
 *           path) and `http.response.status_code`. A Prometheus backend names it
 *           `http_server_request_duration_seconds` (the OTLP translation adds the unit).
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decisions 1 and 3); the OpenTelemetry semantic conventions (HTTP metrics).
 */

/** The HTTP server duration histogram: name, unit and advised bounds (seconds). */
export const HTTP_SERVER_DURATION: {
  readonly name: "http.server.request.duration";
  readonly unit: "s";
  readonly bounds: readonly number[];
} = Object.freeze({
  name: "http.server.request.duration",
  unit: "s",
  bounds: Object.freeze([
    0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1, 2.5, 5, 7.5, 10,
  ]),
});
