/**
 * Stackra file contract:
 * Purpose: `InfraAwsOptions`, the options shape of `InfraAwsConfig`: the target `AwsHealthIndicatorDriver` probes.
 * Boundary: a shape class: fields and defaults only; `InfraAwsConfig$` mirrors it and is the schema `buildConfig` validates
 *           with. The runway's `config.infra_aws` layer sets the target per environment (ADR 0402 decision 5).
 * Runtime: isomorphic
 * Governing contract: ADR 0402 (decision 5: the wiring passes the target from runway data); ADR 0294 (decision 19).
 */
import { Schema } from "@stackra/validation";

/** The options of `InfraAwsConfig`. */
export class InfraAwsOptions extends Schema {
  /** The AWS region the foundation runs in (`me-central-1`), whose STS endpoint the health driver probes; empty until the runway sets it. */
  region = "";
}
