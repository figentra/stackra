/**
 * Stackra file contract:
 * Purpose: `LiveConnectionOptions<C>`, what `liveConnection` takes: the connection's Integration, its fields and the
 *          secret store's values by name.
 * Boundary: a type only. The values are a provider sandbox's credentials; they stay in memory and are never logged.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0308 (rules 2, 3 and 4); ADR 0173 (secrets by name).
 */
import type { Connection, ConnectionFields, IntegrationClass } from "#core/index";

/**
 * The options of `liveConnection`.
 *
 * @example
 * liveConnection(MailConnection, { integration: MailIntegration, fields: { apiKey, region: "eu" } });
 */
export interface LiveConnectionOptions<C extends Connection> {
  /** The Integration `C` holds credentials for: its auth, base URL, headers, retry and rate limits. */
  readonly integration: IntegrationClass<NonNullable<C["~integration"]>>;

  /** The connection's fields, `@Secret` ones included, as `connect` takes them. */
  readonly fields: ConnectionFields<C>;

  /** The secret store's values by name, for the Integration's own `@Secret` fields; empty when left out. */
  readonly secrets?: Readonly<Record<string, string>>;
}
