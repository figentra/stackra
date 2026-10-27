/**
 * Stackra file contract:
 * Purpose: `InfraAwsRuntimeOptions`, the options shape of `InfraAwsRuntimeConfig`: the target `AwsRuntimeHealthIndicatorDriver` probes.
 * Boundary: a shape class: fields and defaults only; `InfraAwsRuntimeConfig$` mirrors it and is the schema `buildConfig` validates
 *           with. The runway's `config.infra_aws_runtime` layer sets the target per environment (ADR 0402 decision 5).
 * Runtime: isomorphic
 * Governing contract: ADR 0402 (decision 5: the wiring passes the target from runway data); ADR 0294 (decision 19).
 */
import { Schema } from "@stackra/validation";

/** The options of `InfraAwsRuntimeConfig`. */
export class InfraAwsRuntimeOptions extends Schema {
  /** The AWS region the runtime resources live in (`me-central-1`), whose SQS endpoint the health driver probes; empty until the runway sets it. */
  region = "";
}
