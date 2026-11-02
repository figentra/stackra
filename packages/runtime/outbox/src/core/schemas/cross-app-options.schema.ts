/**
 * Stackra file contract:
 * Purpose: `CrossAppOptions`, the shape of the cross-app relay's configuration: the environment this instance runs in,
 *          the id and value of the producer's current signing key, and the consumers in other apps it delivers to.
 * Boundary: a schema class. The signing key is a `@Secret`, read from the secret store only, never from runway or the
 *           environment map; the other fields are runway's values for the environment (its `events` block) and the
 *           environment name. Its zod mirror is `CROSS_APP_CONFIG_SCHEMA`.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 12, 16 and 17, amendment of 2026-11-02); ADR 0146 as amended; ADR 0173.
 */
import { Secret } from "@stackra/config";
import { registerSchemas, Schema } from "@stackra/validation";

import type { Subscriber } from "#contracts/types/subscriber.type";
import { CROSS_APP_CONFIG_SCHEMA } from "#core/constants/cross-app-config-schema.constant";

/**
 * The cross-app relay options.
 *
 * @example
 * export class CrossAppConfig extends Config({ schema: CrossAppOptions, env: { environment: "STACKRA_ENVIRONMENT" } }) {}
 */
export class CrossAppOptions extends Schema {
  /** The producer's private Ed25519 signing key (base64url PKCS #8); empty until the secret is set. */
  @Secret("STACKRA_EVENTS_SIGNING_KEY")
  signingKey = "";

  /** The environment this instance runs in (`dev`, `staging`); the inbox accepts the keys a producer lists for it. */
  environment = "dev";

  /** The id of the producer's current signing key, as its manifest lists it; empty while the service sends nothing. */
  keyId = "";

  /** The consumers in other apps this producer delivers to; none while the service delivers nothing across apps. */
  subscribers: Subscriber[] = [];
}

registerSchemas([[CrossAppOptions, CROSS_APP_CONFIG_SCHEMA]]);
