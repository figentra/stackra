/**
 * Stackra file contract:
 * Purpose: `Connection<I>`, the kind base of one stored credential set for Integration `I`, supplied or granted by a
 *          scope or a user: its fields are the form the console generates, its `@Secret` fields are kept encrypted in
 *          the connection store, and `check()` proves the credentials work.
 * Boundary: a bare kind base with the Integration as a type argument (`extends Connection<ResendIntegration>`), bound
 *           to it by name as well (ADR 0305 rule 6); the partner is type-only, so `registerConnections` carries it at
 *           runtime. A connection is a record a `ConnectionStore` loads, never injected and never built with `new` by
 *           an author; `id`, `source`, `resourceId` and `api` are read-only and kept beside the instance (`source`
 *           says managed or bring-your-own). One connection class per
 *           Integration (ADR 0308 rule 2). The optional `subscribe()` and `unsubscribe()` are not declared here, so a
 *           class that has them adds them as its own methods and may say so with `implements ConnectionWebhooks`.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 2, 3, 13, 14 and 17); ADR 0305 (rules 5 and 6); ADR 0294 (decision 16).
 */
import { registerKind } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";

import { ProviderSource } from "#contracts/enums/provider-source.enum";
import type { Integration } from "#core/bases/integration.base";
import { CONNECTION_STATE } from "#core/constants/connection-state.constant";
import type { IntegrationApi } from "#core/types/integration-api.type";
import type { ConnectedAccount } from "#core/values/connected-account.value";

/** The state a store attached, or a `TypeError` for an instance no store loaded. */
function stateOf(connection: object): NonNullable<ReturnType<typeof CONNECTION_STATE.get>> {
  const state = CONNECTION_STATE.get(connection);
  if (state === undefined)
    throw new TypeError(
      `${connection.constructor.name} was not loaded by a ConnectionStore: get it with find, byId or list (makeConnection in a test)`,
    );
  return state;
}

/**
 * The connection kind base.
 *
 * @example
 * export class ResendConnection extends Connection<ResendIntegration> {
 *   @Secret("RESEND_TENANT_API_KEY")
 *   apiKey!: string;
 *
 *   fromAddress!: Email;
 *
 *   async check(): Promise<ConnectedAccount> {
 *     const domains = await this.api.get<ResendDomainList>("/domains");
 *     return ConnectedAccount.create({ id: domains.data[0].name });
 *   }
 * }
 */
export abstract class Connection<I extends Integration = Integration> {
  /** Type-only kind brand, so a class of another kind cannot stand in for a connection. */
  declare readonly "~kind": "connection";

  /** Type-only: the Integration this connection holds credentials for. */
  declare readonly "~integration"?: I;

  /** The connection's public id, the `:connectionId` of its webhook URL. */
  get id(): PublicId<"conn"> {
    return stateOf(this).id;
  }

  /** Whose account it acts on: `managed` (the platform's key and a per-tenant resource) or `byo` (the default). */
  get source(): ProviderSource {
    return stateOf(this).source ?? ProviderSource.Byo;
  }

  /** The managed resource on the platform account a `managed` connection points at. */
  get resourceId(): string | undefined {
    return stateOf(this).resourceId;
  }

  /** The managed client with this connection's credentials, the Integration's filling any it leaves empty. */
  get api(): IntegrationApi {
    const { api } = stateOf(this);
    if (api === undefined)
      throw new TypeError(`${this.constructor.name} has no managed client yet`);
    return api;
  }

  /**
   * Proves the credentials work and names the account they act as. Runs at connect (nothing is stored if it throws),
   * from the console's test button and on the Integration's health schedule.
   *
   * @throws ConnectionCheckFailedError when the account cannot serve.
   */
  abstract check(): Promise<ConnectedAccount>;
}

registerKind(Connection, "connection");
