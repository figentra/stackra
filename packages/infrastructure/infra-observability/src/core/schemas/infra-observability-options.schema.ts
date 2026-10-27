/**
 * Stackra file contract:
 * Purpose: `InfraObservabilityOptions`, the options shape of `InfraObservabilityConfig`: the target `ObservabilityHealthIndicatorDriver` probes.
 * Boundary: a shape class: fields and defaults only; `InfraObservabilityConfig$` mirrors it and is the schema `buildConfig` validates
 *           with. The runway's `config.infra_observability` layer sets the target per environment (ADR 0402 decision 5).
 * Runtime: isomorphic
 * Governing contract: ADR 0402 (decision 5: the wiring passes the target from runway data); ADR 0294 (decision 19).
 */
import { Schema } from "@stackra/validation";

/** The options of `InfraObservabilityConfig`. */
export class InfraObservabilityOptions extends Schema {
  /** The telemetry endpoint (an `https://` URL), which the health driver probes; empty until the runway sets it. */
  url = "";
}
