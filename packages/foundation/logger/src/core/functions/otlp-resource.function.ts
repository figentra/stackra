/**
 * Stackra file contract:
 * Purpose: `otlpResource(serviceName)`, the OTLP/JSON resource every span and metric of this package carries:
 *          `service.name` (when set) and the `telemetry.sdk.*` attributes that name the exporter.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decision 1); the OpenTelemetry resource semantic conventions.
 */

/**
 * The resource of `serviceName`.
 *
 * @example
 * otlpResource("orders"); // { attributes: [{ key: "service.name", value: { stringValue: "orders" } }, ...] }
 */
export function otlpResource(serviceName: string): object {
  return {
    attributes: [
      ...(serviceName === "" ? [] : [{ key: "service.name", value: { stringValue: serviceName } }]),
      { key: "telemetry.sdk.name", value: { stringValue: "@stackra/logger" } },
      { key: "telemetry.sdk.language", value: { stringValue: "webjs" } },
    ],
  };
}
