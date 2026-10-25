/**
 * Stackra file contract:
 * Purpose: `ConnectInput<C>`, what `ConnectionStore#connect` takes: the connection's fields, the level it sits at, the
 *          OAuth tokens of a code exchange, and the webhook URL to subscribe.
 * Boundary: a type only. The owner is the running call's (its scope node, or its user), read from `ConnectionContext`,
 *           never input. `check()` runs before anything is stored.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 2, 9, 14 and 17).
 */
import type { Connection } from "#core/bases/connection.base";
import type { ConnectionLevel } from "#core/enums/connection-level.enum";
import type { ConnectionFields } from "#core/types/connection-fields.type";
import type { OAuthTokens } from "#core/types/oauth-tokens.type";

/**
 * The input of a connect.
 *
 * @example
 * await store.connect(ResendConnection, { fields: { apiKey, fromAddress, webhookSecret } });
 */
export interface ConnectInput<C extends Connection> {
  /** The connection's fields, `@Secret` ones included. */
  readonly fields: ConnectionFields<C>;

  /** The level it sits at; the Integration's first level when left out. */
  readonly level?: ConnectionLevel;

  /** The tokens of an `OAuth2Code` exchange. */
  readonly tokens?: OAuthTokens;

  /** The connection's webhook URL, subscribed at the provider when the connection has `subscribe()`. */
  readonly webhookUrl?: string;
}
