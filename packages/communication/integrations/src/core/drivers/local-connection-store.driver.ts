/**
 * Stackra file contract:
 * Purpose: `LocalConnectionStoreDriver`, the `local` `ConnectionStore`: connections kept in this process, their OAuth
 *          tokens renewed and revoked by the `IntegrationRuntime`, for the template and for development.
 * Boundary: one process, in memory: a restart forgets every connection, and nothing is encrypted at rest because
 *           nothing is at rest. A deployment binds the `hosted` driver, whose store host keeps the credentials
 *           encrypted (ADR 0308 rule 12 and its consequences). The owner of a new connection, and the owners a lookup
 *           reaches, come from `ConnectionContext`. Disconnect unsubscribes before it revokes, because the provider
 *           call needs live credentials.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 2, 9, 10, 12, 14, 17 and 18); ADR 0266 (memory drivers first).
 */
import { Driver } from "@stackra/container";
import { NotFoundError } from "@stackra/errors";

import type { ConnectionContext } from "#contracts/ports/connection-context.port";
import type { Connection } from "#core/bases/connection.base";
import { LOCAL_CONNECTIONS } from "#core/constants/local-connections.constant";
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
import { ConnectionStore } from "#core/ports/connection-store.port";
import type { IntegrationRuntime } from "#core/services/integration-runtime.service";
import type { ConnectInput } from "#core/types/connect-input.type";
import type { ConnectionClass } from "#core/types/connection-class.type";
import type { ConnectionRecord } from "#core/types/connection-record.type";
import type { ConnectionWebhooks } from "#core/types/connection-webhooks.type";

/** A stored record with its class. */
type LocalRecord = ConnectionRecord & { readonly type: ConnectionClass };

/**
 * Connections in memory.
 *
 * @example
 * const store = new LocalConnectionStoreDriver(context, runtime);
 * await store.connect(ResendConnection, { fields: { apiKey, fromAddress, webhookSecret } });
 */
export class LocalConnectionStoreDriver extends Driver(ConnectionStore) {
  /** The owners the running call reaches. */
  private readonly context: ConnectionContext;

  /** Makes clients and holds tokens. */
  private readonly runtime: IntegrationRuntime;

  /** Connection id to its record. */
  private readonly records = new Map<string, LocalRecord>();

  /**
   * @param context - the running call's owners.
   * @param runtime - the integration runtime.
   */
  constructor(context: ConnectionContext, runtime: IntegrationRuntime) {
    super();
    this.context = context;
    this.runtime = runtime;
    LOCAL_CONNECTIONS.set(this, this.records);
  }

  async find<C extends Connection>(type: ConnectionClass<C>): Promise<C | null> {
    const { integration, key } = registrationOf(type);
    const [first] = reachableConnections(
      this.recordsOf(type),
      integrationOptionsOf(integration).levels,
      this.context,
    );
    const [record, ...others] = first?.records ?? [];
    if (first === undefined || record === undefined) return null;
    if (others.length > 0)
      throw ConnectionAmbiguousError.create({ integration: key, level: first.level });
    return this.load(type, record);
  }

  async byId<C extends Connection>(type: ConnectionClass<C>, id: string): Promise<C> {
    return this.load(type, this.recordOf(type, id));
  }

  async list<C extends Connection>(type: ConnectionClass<C>): Promise<C[]> {
    const { integration } = registrationOf(type);
    return reachableConnections(
      this.recordsOf(type),
      integrationOptionsOf(integration).levels,
      this.context,
    ).flatMap((tier) => tier.records.map((record) => this.load(type, record)));
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
    const draft = {
      id: newConnectionId(),
      level,
      ...ownerOf(level, this.context),
      ...splitFields(type, input.fields),
    };
    const { connection, record } = await prepareConnection(
      type,
      integration,
      draft,
      (built) => this.runtime.client(integration, built, input.tokens),
      input.webhookUrl,
    );
    const replaced = options.multiple
      ? []
      : this.recordsOf(type).filter((known) => sameOwner(known, record));
    this.records.set(record.id, { ...record, type });
    for (const old of replaced) await this.disconnect(type, old.id);
    return connection;
  }

  async disconnect(type: ConnectionClass, id: string): Promise<void> {
    const connection = this.load(type, this.recordOf(type, id));
    const webhooks = connection as Connection & ConnectionWebhooks;
    if (webhooks.unsubscribe !== undefined) await webhooks.unsubscribe();
    await this.runtime.revoke(
      this.runtime.integration(registrationOf(type).integration),
      connection,
    );
    this.records.delete(id);
  }

  /** The records of `type`. */
  private recordsOf(type: ConnectionClass): LocalRecord[] {
    return [...this.records.values()].filter((record) => record.type === type);
  }

  /** The record `id` of `type`, or `NotFoundError`. */
  private recordOf(type: ConnectionClass, id: string): LocalRecord {
    const record = this.records.get(id);
    if (record?.type !== type) throw NotFoundError.create();
    return record;
  }

  /** The loaded connection of `record`, with a client over its credentials. */
  private load<C extends Connection>(type: ConnectionClass<C>, record: ConnectionRecord): C {
    const integration = this.runtime.integration(registrationOf(type).integration);
    return hydrateConnection(type, record, (built) => this.runtime.client(integration, built));
  }
}
