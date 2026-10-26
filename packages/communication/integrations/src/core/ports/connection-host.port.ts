/**
 * Stackra file contract:
 * Purpose: the `ConnectionHost` port: the store host behind the `hosted` driver, which keeps every connection's
 *          credentials encrypted under its scope's data key, refreshes OAuth tokens single-flight and revokes them at
 *          disconnect.
 * Boundary: an abstract class that is its own token; the integrations service's generated client implements it. Refresh
 *           tokens and client secrets never leave the host: a record carries only what the managed client sends, and
 *           an OAuth connection's access token comes from `accessToken` (ADR 0308 rule 20). The host keeps a tombstone
 *           of each disconnected connection and emits the lifecycle events (rule 18). It stays in `.`, not
 *           `./contracts`: its signatures use `ConnectionRecord` (a stored connection, with its `ConnectionLevel` and
 *           `ConnectedAccount`) and `OAuthTokens` of `.`, beside the `Connection` base the template imports from
 *           `@stackra/integrations`. `store` takes the credentials' expiry as an optional last argument, so a host
 *           written before it still implements the port. `ClientConnectionHostDriver` implements it over the
 *           service's generated client.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 3, 7, 12, 18 and 20); ADR 0188 (envelope encryption); ADR 0294 (decision 15); ADR 0049 (decision 5: expiry alerts).
 */
import { Port, type PublicId, type ScopeRef } from "@stackra/contracts";

import type { ConnectionRecord } from "#core/types/connection-record.type";
import type { OAuthTokens } from "#core/types/oauth-tokens.type";

/**
 * The integrations service, as a connection store sees it.
 *
 * @example
 * const records = await host.list("messages.resend", { scope, userId });
 */
export abstract class ConnectionHost extends Port {
  /** The connections of integration `key` owned by `userId` or by `scope` or a node above it. */
  abstract list(
    key: string,
    owners: { readonly scope?: ScopeRef; readonly userId?: PublicId<"usr"> },
  ): Promise<readonly ConnectionRecord[]>;

  /** The connection `id` of integration `key`; null when there is none or it was disconnected. */
  abstract get(key: string, id: string): Promise<ConnectionRecord | null>;

  /**
   * Stores a checked connection and the tokens of its code exchange, encrypted.
   *
   * @param credentialsExpireAt - when the credentials stop working (an API key's or a certificate's end), so the host
   *                              alerts before it; none when they do not expire or the provider does not say.
   */
  abstract store(
    key: string,
    record: ConnectionRecord,
    tokens: OAuthTokens | undefined,
    credentialsExpireAt?: Date,
  ): Promise<void>;

  /** Revokes the connection's tokens at the provider, destroys its credentials and keeps a tombstone. */
  abstract disconnect(key: string, id: string): Promise<void>;

  /** A fresh access token of an OAuth connection. */
  abstract accessToken(key: string, id: string): Promise<string>;
}
