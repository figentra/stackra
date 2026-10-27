/**
 * Stackra file contract:
 * Purpose: `MemoryConnectionStoreDriver`, the `memory` `ConnectionStore`: the `local` store's behaviour under the name
 *          a test's `useDrivers("memory")` picks, so a host with both `local` and `hosted` candidates boots in memory.
 * Boundary: one process, in memory, nothing at rest: it delegates every call to a `LocalConnectionStoreDriver` it
 *           owns and shares that store's records in `LOCAL_CONNECTIONS`, so the testing plugin's seeding works on it
 *           too. A deployment binds `hosted`.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 12); ADR 0266 (memory drivers first); ADR 0269 (fakes are real drivers).
 */
import { Driver } from "@stackra/container";

import type { ConnectionContext } from "#contracts/ports/connection-context.port";
import type { Connection } from "#core/bases/connection.base";
import { LOCAL_CONNECTIONS } from "#core/constants/local-connections.constant";
import { LocalConnectionStoreDriver } from "#core/drivers/local-connection-store.driver";
import { ConnectionStore } from "#core/ports/connection-store.port";
import type { IntegrationRuntime } from "#core/services/integration-runtime.service";
import type { ConnectInput } from "#core/types/connect-input.type";
import type { ConnectionClass } from "#core/types/connection-class.type";

/**
 * Connections in memory, for tests.
 *
 * @example
 * const app = await createTestingModule(NotificationsModule).useDrivers("memory").compile();
 */
export class MemoryConnectionStoreDriver extends Driver(ConnectionStore) {
  /** The in-process store every call goes to. */
  private readonly local: LocalConnectionStoreDriver;

  /**
   * @param context - the running call's owners.
   * @param runtime - the integration runtime.
   */
  constructor(context: ConnectionContext, runtime: IntegrationRuntime) {
    super();
    this.local = new LocalConnectionStoreDriver(context, runtime);
    const records = LOCAL_CONNECTIONS.get(this.local);
    if (records !== undefined) LOCAL_CONNECTIONS.set(this, records);
  }

  /** Implements `ConnectionStore.find` by delegating to the in-process local store. */
  find<C extends Connection>(type: ConnectionClass<C>): Promise<C | null> {
    return this.local.find(type);
  }

  /** Implements `ConnectionStore.byId` by delegating to the in-process local store. */
  byId<C extends Connection>(type: ConnectionClass<C>, id: string): Promise<C> {
    return this.local.byId(type, id);
  }

  /** Implements `ConnectionStore.list` by delegating to the in-process local store. */
  list<C extends Connection>(type: ConnectionClass<C>): Promise<C[]> {
    return this.local.list(type);
  }

  /** Implements `ConnectionStore.connect` by delegating to the in-process local store. */
  connect<C extends Connection>(type: ConnectionClass<C>, input: ConnectInput<C>): Promise<C> {
    return this.local.connect(type, input);
  }

  /** Implements `ConnectionStore.disconnect` by delegating to the in-process local store. */
  disconnect(type: ConnectionClass, id: string): Promise<void> {
    return this.local.disconnect(type, id);
  }
}
