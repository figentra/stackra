/**
 * Stackra file contract:
 * Purpose: `liveConnection`, a loaded connection whose `api` is the real managed client: the Integration's auth, base
 *          URL, headers, retry and rate limits over the given fields and secrets, so a connector certification suite in
 *          a product runs a connector against a provider sandbox with no service and no ConnectionStore.
 * Boundary: builds its own `IntegrationRuntime` over the memory secret store, the memory rate-limit store and the
 *           system clock, so the client is made exactly as a store makes it for a stored connection; `managedClient`
 *           stays internal. Calls leave the process through `fetch`. An `OAuth2Code` integration needs stored tokens,
 *           which this does not take. No secret value is logged or put in an error.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0308 (rules 2, 3, 4, 6, 13 and 20); ADR 0173 (secrets by name).
 */
import { MemoryRateLimitStoreDriver } from "@stackra/actions";
import { MemorySecretStoreDriver } from "@stackra/config";
import { SystemClockDriver } from "@stackra/container";

import { hydrateConnection } from "#core/functions/hydrate-connection.function";
import { splitFields } from "#core/functions/split-fields.function";
import { IntegrationRuntime } from "#core/index";
import type { Connection, ConnectionClass } from "#core/index";
import type { LiveConnectionOptions } from "#testing/types/live-connection-options.type";

/**
 * A loaded connection of `type` that calls the provider for real.
 *
 * @throws TypeError when a `@Secret` field's value is not a string (naming the field, never the value).
 * @example
 * const connection = liveConnection(MailConnection, {
 *   integration: MailIntegration,
 *   fields: { apiKey: process.env["MAIL_SANDBOX_KEY"] ?? "", region: "eu" },
 * });
 * await expect(connection.check()).resolves.toBeDefined();
 */
export function liveConnection<C extends Connection>(
  type: ConnectionClass<C>,
  options: LiveConnectionOptions<C>,
): C {
  const secrets = new MemorySecretStoreDriver();
  for (const [name, value] of Object.entries(options.secrets ?? {})) secrets.set(name, value);
  const runtime = new IntegrationRuntime(
    secrets,
    new MemoryRateLimitStoreDriver(),
    new SystemClockDriver(),
  );
  const integration = runtime.integration(options.integration);
  return hydrateConnection(
    type,
    { id: "conn_00000000000000000000000000", ...splitFields(type, options.fields) },
    (built) => runtime.client(integration, built),
  );
}
