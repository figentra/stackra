/**
 * Stackra file contract:
 * Purpose: `HostedConnectionStoreDriver`, the `hosted` `ConnectionStore`: connections kept by the integrations service
 *          through the `ConnectionHost` port, which encrypts their credentials, renews their OAuth tokens and revokes
 *          them at disconnect.
 * Boundary: the refresh tokens and the client secrets live only in the store host (ADR 0308 rule 12): an OAuth
 *           connection's client asks the host for each fresh access token, and the tokens of a code exchange go
 *           straight to the host after `check()` has run on the access token alone. `check()` and `subscribe()` run
 *           here, before the host stores anything; the host keeps the tombstone and emits the lifecycle events.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 2, 7, 9, 10, 12, 14, 17, 18 and 20).
 */
import { Driver } from "@stackra/container";
import { NotFoundError } from "@stackra/errors";

import type { Connection } from "#core/bases/connection.base";
import { AuthType } from "#core/enums/auth-type.enum";
import { ConnectionAmbiguousError } from "#core/errors/connection-ambiguous.error";
import { hydrateConnection } from "#core/functions/hydrate-connection.function";
import { integrationOptionsOf } from "#core/functions/integration-options-of.function";
import { newConnectionId } from "#core/functions/new-connection-id.function";
import { ownerOf } from "#core/functions/owner-of.function";
import { prepareConnection } from "#core/functions/prepare-connection.function";
import { reachableConnections } from "#core/functions/reachable-connections.function";
import { registrationOf } from "#core/functions/registration-of.function";
import { sameOwner } from "#core/functions/same-owner.function";
import { splitFields } from "#core/functions/split-fields.function";
import type { ConnectionContext } from "#core/ports/connection-context.port";
import type { ConnectionHost } from "#core/ports/connection-host.port";
import { ConnectionStore } from "#core/ports/connection-store.port";
import type { IntegrationRuntime } from "#core/services/integration-runtime.service";
import type { ConnectInput } from "#core/types/connect-input.type";
import type { ConnectionClass } from "#core/types/connection-class.type";
import type { ConnectionRecord } from "#core/types/connection-record.type";
import type { ConnectionWebhooks } from "#core/types/connection-webhooks.type";

/**
 * Connections in the integrations service.
 *
 * @example
 * const own = await store.find(ResendConnection); // the host's record, with a client over its credentials
 */
export class HostedConnectionStoreDriver extends Driver(ConnectionStore) {
  /** The owners the running call reaches. */
  private readonly context: ConnectionContext;

  /** Makes clients. */
  private readonly runtime: IntegrationRuntime;

  /** The store host. */
  private readonly host: ConnectionHost;

  /**
   * @param context - the running call's owners.
   * @param runtime - the integration runtime.
   * @param host - the integrations service's client.
   */
  constructor(context: ConnectionContext, runtime: IntegrationRuntime, host: ConnectionHost) {
    super();
    this.context = context;
    this.runtime = runtime;
    this.host = host;
  }

  async find<C extends Connection>(type: ConnectionClass<C>): Promise<C | null> {
    const [first] = await this.reachable(type);
    const [record, ...others] = first?.records ?? [];
    if (first === undefined || record === undefined) return null;
    if (others.length > 0)
      throw ConnectionAmbiguousError.create({
        integration: registrationOf(type).key,
        level: first.level,
      });
    return this.load(type, record);
  }

  async byId<C extends Connection>(type: ConnectionClass<C>, id: string): Promise<C> {
    const record = await this.host.get(registrationOf(type).key, id);
    if (record === null) throw NotFoundError.create();
    return this.load(type, record);
  }

  async list<C extends Connection>(type: ConnectionClass<C>): Promise<C[]> {
    return (await this.reachable(type)).flatMap((tier) =>
      tier.records.map((record) => this.load(type, record)),
    );
  }

  async connect<C extends Connection>(
    type: ConnectionClass<C>,
    input: ConnectInput<C>,
  ): Promise<C> {
    const registration = registrationOf(type);
    const options = integrationOptionsOf(registration.integration);
    const level = input.level ?? options.levels[0];
    if (level === undefined || !options.levels.includes(level))
      throw new TypeError(
        `${registration.integration.name} does not hold ${String(level)} connections`,
      );
    const integration = this.runtime.integration(registration.integration);
    const owner = ownerOf(level, this.context);
    const draft = { id: newConnectionId(), level, ...owner, ...splitFields(type, input.fields) };
    const { tokens } = input;
    const { record } = await prepareConnection(
      type,
      integration,
      draft,
      // The exchange's access token alone: its refresh token goes to the host, never into this process's memory.
      (built) =>
        this.runtime.client(
          integration,
          built,
          tokens === undefined ? undefined : async () => tokens.accessToken,
        ),
      input.webhookUrl,
    );
    await this.host.store(registration.key, record, tokens);
    if (!options.multiple)
      for (const old of await this.host.list(registration.key, owner))
        if (old.id !== record.id && sameOwner(old, record)) await this.disconnect(type, old.id);
    return this.load(type, record);
  }

  async disconnect(type: ConnectionClass, id: string): Promise<void> {
    const connection = (await this.byId(type, id)) as Connection & ConnectionWebhooks;
    if (connection.unsubscribe !== undefined) await connection.unsubscribe();
    await this.host.disconnect(registrationOf(type).key, id);
  }

  /** The records of `type` the running call reaches, in tiers. */
  private async reachable(type: ConnectionClass) {
    const { integration, key } = registrationOf(type);
    const scope = this.context.scope();
    const userId = this.context.user();
    const records = await this.host.list(key, {
      ...(scope === undefined ? {} : { scope }),
      ...(userId === undefined ? {} : { userId }),
    });
    return reachableConnections(records, integrationOptionsOf(integration).levels, this.context);
  }

  /** The loaded connection of `record`; an OAuth connection's access tokens come from the host. */
  private load<C extends Connection>(type: ConnectionClass<C>, record: ConnectionRecord): C {
    const { integration: integrationType, key } = registrationOf(type);
    const integration = this.runtime.integration(integrationType);
    const { auth } = integrationOptionsOf(integrationType);
    const oauth =
      auth.type === AuthType.OAuth2Code || auth.type === AuthType.OAuth2ClientCredentials;
    return hydrateConnection(type, record, (built) =>
      this.runtime.client(
        integration,
        built,
        oauth ? () => this.host.accessToken(key, record.id) : undefined,
      ),
    );
  }
}
