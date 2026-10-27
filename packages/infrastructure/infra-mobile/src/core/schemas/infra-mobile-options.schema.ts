/**
 * Stackra file contract:
 * Purpose: `InfraMobileOptions`, the options shape of `InfraMobileConfig`: the target `MobileHealthIndicatorDriver` probes.
 * Boundary: a shape class: fields and defaults only; `InfraMobileConfig$` mirrors it and is the schema `buildConfig` validates
 *           with. The runway's `config.infra_mobile` layer sets the target per environment (ADR 0402 decision 5).
 * Runtime: isomorphic
 * Governing contract: ADR 0402 (decision 5: the wiring passes the target from runway data); ADR 0294 (decision 19).
 */
import { Schema } from "@stackra/validation";

/** The options of `InfraMobileConfig`. */
export class InfraMobileOptions extends Schema {
  /** The app's Expo project id (a UUID), whose EAS update endpoint the health driver probes; empty until the runway sets it. */
  projectId = "";
}
