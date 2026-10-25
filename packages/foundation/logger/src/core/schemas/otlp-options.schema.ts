/**
 * Stackra file contract:
 * Purpose: `OtlpOptions`, the shape of `OtlpConfig`: where the OTLP/HTTP collector is, the service name every record
 *          carries, the name of the secret that holds the collector's headers, and how records are batched.
 * Boundary: a shape class; it registers this package's own schema (`OTLP_CONFIG_SCHEMA`) for itself when the module
 *           loads. The collector's auth headers are a secret by name (`headersSecret`, the OpenTelemetry
 *           `OTEL_EXPORTER_OTLP_HEADERS` form `k=v,k2=v2`), read through the `SecretStore` port, never a value here. With
 *           no endpoint the reporter sends nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decisions 1 and 2: OTLP everywhere); ADR 0147 (decision 1: OTLP is the production
 *                     default); ADR 0173 (secrets by name); ADR 0294 (decisions 19 and 26).
 */
import { registerSchemas, Schema } from "@stackra/validation";

import { OTLP_CONFIG_SCHEMA } from "#core/constants/otlp-config-schema.constant";

/**
 * The OTLP log reporter's settings.
 *
 * @example
 * export class OtlpConfig extends BaseOtlpConfig {
 *   override endpoint = "https://otlp.example.test";
 *   override serviceName = "orders";
 * }
 */
export class OtlpOptions extends Schema {
  /** The collector's base URL (`https://otlp.example.test`); logs go to `<endpoint>/v1/logs`. Empty sends nothing. */
  endpoint = "";

  /** The `service.name` resource attribute of every record; empty leaves it out. */
  serviceName = "";

  /** The SCREAMING_SNAKE name of the secret holding the collector's headers (`k=v,k2=v2`); none when unset. */
  headersSecret = "OTEL_EXPORTER_OTLP_HEADERS";

  /** Records sent in one request; a full batch is sent at once. */
  batchSize = 100;

  /** The longest a record waits before its batch is sent, in milliseconds. */
  flushIntervalMs = 2000;

  /** Records held while the collector is slow; past it, the oldest are dropped. */
  maxQueue = 2000;
}

registerSchemas([[OtlpOptions, OTLP_CONFIG_SCHEMA]]);
