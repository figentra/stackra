/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryConnectionStoreDriver`: a `ConnectionStore` that shares its local store's records in
 *          `LOCAL_CONNECTIONS`, and refuses an unknown id as the local store does.
 * Boundary: test only; stub context and runtime, since no call here reaches them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0266 (memory drivers first); ADR 0308 (rule 12).
 */
import { NotFoundError } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import type { ConnectionContext } from "#contracts/ports/connection-context.port";
import { Connection } from "#core/bases/connection.base";
import { LOCAL_CONNECTIONS } from "#core/constants/local-connections.constant";
import { MemoryConnectionStoreDriver } from "#core/drivers/memory-connection-store.driver";
import { ConnectionStore } from "#core/ports/connection-store.port";
import type { IntegrationRuntime } from "#core/services/integration-runtime.service";
import type { ConnectionClass } from "#core/types/connection-class.type";

const store = (): MemoryConnectionStoreDriver =>
  new MemoryConnectionStoreDriver({} as ConnectionContext, {} as IntegrationRuntime);

describe("MemoryConnectionStoreDriver", () => {
  it("is a ConnectionStore", () => {
    expect(store()).toBeInstanceOf(ConnectionStore);
  });

  it("shares its records with the testing plugin, one map per instance", () => {
    const first = store();
    expect(LOCAL_CONNECTIONS.get(first)).toBeInstanceOf(Map);
    expect(LOCAL_CONNECTIONS.get(first)).not.toBe(LOCAL_CONNECTIONS.get(store()));
  });

  it("refuses an unknown id", async () => {
    await expect(
      store().byId(Connection as unknown as ConnectionClass, "conn_00000000000000000000000009"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
