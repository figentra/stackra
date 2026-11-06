/**
 * Stackra file contract:
 * Purpose: `RelayInboxConfig`, a consumer's inbox configuration (key `outbox.relay_inbox`): the running environment
 *          (`STACKRA_ENVIRONMENT`) and the public keys of each producer it pins, per environment.
 * Boundary: a configuration class over `RelayInboxOptions`; gen emits `producers` from the pinned contracts' manifest
 *           `relay.keys` at build time; the environment comes from the runtime. Public facts only.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 16 and 18, amendment of 2026-11-02); ADR 0294 (decisions 19 and 20);
 *                     ADR 0146 as amended.
 */
import { Config } from "@stackra/config";

import { RelayInboxOptions } from "#core/schemas/relay-inbox-options.schema";

/**
 * The consumer inbox configuration.
 *
 * @example
 * buildConfig(RelayInboxConfig, { values: { environment: "dev", producers: { pay: { dev: [key] } } } });
 */
export class RelayInboxConfig extends Config({
  schema: RelayInboxOptions,
  env: { environment: "STACKRA_ENVIRONMENT" },
}) {}
