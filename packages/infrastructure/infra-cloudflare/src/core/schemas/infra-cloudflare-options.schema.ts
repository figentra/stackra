/**
 * Stackra file contract:
 * Purpose: `InfraCloudflareOptions`, the options shape of `InfraCloudflareConfig`: the target `CloudflareHealthIndicatorDriver` probes.
 * Boundary: a shape class: fields and defaults only; `InfraCloudflareConfig$` mirrors it and is the schema `buildConfig` validates
 *           with. The runway's `config.infra_cloudflare` layer sets the target per environment (ADR 0402 decision 5).
 * Runtime: isomorphic
 * Governing contract: ADR 0402 (decision 5: the wiring passes the target from runway data); ADR 0294 (decision 19).
 */
import { Schema } from "@stackra/validation";

/** The options of `InfraCloudflareConfig`. */
export class InfraCloudflareOptions extends Schema {
  /** A host on a zone the edge serves (`api.acme.example`, no scheme), which the health driver probes; empty until the runway sets it. */
  host = "";
}
