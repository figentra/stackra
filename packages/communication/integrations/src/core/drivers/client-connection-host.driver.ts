/**
 * Stackra file contract:
 * Purpose: `ClientConnectionHostDriver`, the `ConnectionHost` over the integrations service's generated client: `list`
 *          calls resolve, `get` load, `store` store (with the credentials' expiry), `disconnect` disconnect and
 *          `accessToken` token.
 * Boundary: the refs are configuration (`ConnectionHostCalls`): the host subclasses this driver and passes the refs
 *           gen wrote into `#stackra/clients/<service>`, so no wire key or route is named here. Refusals and transport
 *           failures pass through unchanged (a `ClientError`); a load with no record answers null. Refresh tokens and
 *           client secrets never cross: the service answers records and access tokens only (ADR 0308 rule 20).
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 12, 18 and 20); ADR 0260 (decisions 3, 4 and 6); ADR 0266 (decision 5: config
 *                     picks the driver); ADR 0049 (decision 5: expiry alerts).
 */
import type { ClientTransport } from "@stackra/clients/contracts";
import { Driver } from "@stackra/container";
import type { PublicId, ScopeRef } from "@stackra/contracts";

import { ConnectionHostClient } from "#core/clients/connection-host.client";
import { ConnectionHost } from "#core/ports/connection-host.port";
import type { ConnectionHostCalls } from "#core/types/connection-host-calls.type";
import type { ConnectionRecord } from "#core/types/connection-record.type";
import type { OAuthTokens } from "#core/types/oauth-tokens.type";

/**
 * Connections kept by the integrations service, reached through its client.
 *
 * @example
 * // the host's driver, over the refs gen wrote
 * export class OsConnectionHostDriver extends ClientConnectionHostDriver {
 *   constructor(transport: ClientTransport) {
 *     super(transport, {
 *       resolve: ResolveConnectionsQuery,
 *       load: LoadConnectionQuery,
 *       store: StoreConnectionAction,
 *       disconnect: DisconnectConnectionAction,
 *       token: IssueAccessTokenAction,
 *     });
 *   }
 * }
 */
export class ClientConnectionHostDriver extends Driver(ConnectionHost) {
  /** The integrations service's client. */
  private readonly client: ConnectionHostClient;

  /**
   * @param transport - the transport topology picked for calls to the integrations service.
   * @param calls - the service's generated refs.
   */
  constructor(transport: ClientTransport, calls: ConnectionHostCalls) {
    super();
    this.client = new ConnectionHostClient(transport, calls);
  }

  async list(
    key: string,
    owners: { readonly scope?: ScopeRef; readonly userId?: PublicId<"usr"> },
  ): Promise<readonly ConnectionRecord[]> {
    const answer = (await this.client.resolve({
      integrationKey: key,
      ...(owners.scope === undefined ? {} : { scope: owners.scope }),
      ...(owners.userId === undefined ? {} : { userId: owners.userId }),
    })) as { readonly items: readonly ConnectionRecord[] };
    return answer.items;
  }

  async get(key: string, id: string): Promise<ConnectionRecord | null> {
    const answer = (await this.client.load({ integrationKey: key, id })) as {
      readonly record?: ConnectionRecord;
    };
    return answer.record ?? null;
  }

  async store(
    key: string,
    record: ConnectionRecord,
    tokens: OAuthTokens | undefined,
    credentialsExpireAt?: Date,
  ): Promise<void> {
    await this.client.store({
      integrationKey: key,
      record,
      ...(tokens === undefined ? {} : { tokens }),
      ...(credentialsExpireAt === undefined ? {} : { credentialsExpireAt }),
    });
  }

  async disconnect(key: string, id: string): Promise<void> {
    await this.client.disconnect({ id, integrationKey: key });
  }

  async accessToken(key: string, id: string): Promise<string> {
    const answer = (await this.client.token({ integrationKey: key, id })) as {
      readonly accessToken: string;
    };
    return answer.accessToken;
  }
}
