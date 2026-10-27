/**
 * Stackra file contract:
 * Purpose: `InfraIdentityOptions`, the options shape of `InfraIdentityConfig`: the target `IdentityHealthIndicatorDriver` probes.
 * Boundary: a shape class: fields and defaults only; `InfraIdentityConfig$` mirrors it and is the schema `buildConfig` validates
 *           with. The runway's `config.infra_identity` layer sets the target per environment (ADR 0402 decision 5).
 * Runtime: isomorphic
 * Governing contract: ADR 0402 (decision 5: the wiring passes the target from runway data); ADR 0294 (decision 19).
 */
import { Schema } from "@stackra/validation";

/** The options of `InfraIdentityConfig`. */
export class InfraIdentityOptions extends Schema {
  /** The ZITADEL instance's domain (`id.acme.example`, no scheme), whose OpenID discovery document the health driver reads; empty until the runway sets it. */
  domain = "";
}
