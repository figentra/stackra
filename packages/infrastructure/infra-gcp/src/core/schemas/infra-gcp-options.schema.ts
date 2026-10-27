/**
 * Stackra file contract:
 * Purpose: `InfraGcpOptions`, the options shape of `InfraGcpConfig`: the target `GcpHealthIndicatorDriver` probes.
 * Boundary: a shape class: fields and defaults only; `InfraGcpConfig$` mirrors it and is the schema `buildConfig` validates
 *           with. The runway's `config.infra_gcp` layer sets the target per environment (ADR 0402 decision 5).
 * Runtime: isomorphic
 * Governing contract: ADR 0402 (decision 5: the wiring passes the target from runway data); ADR 0294 (decision 19).
 */
import { Schema } from "@stackra/validation";

/** The options of `InfraGcpConfig`. */
export class InfraGcpOptions extends Schema {
  /** The GCP region of the deployment (`me-central2`), whose Cloud Run endpoint the health driver probes; empty until the runway sets it. */
  region = "";
}
