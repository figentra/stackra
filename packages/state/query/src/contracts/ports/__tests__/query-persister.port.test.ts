/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `QueryPersister` port: a port a driver implements (encryption flag, read and
 *          write by area and key), keyed so that `DriverName<QueryPersister>` is exactly this package's driver names.
 * Boundary: test only; the registry entry comes from this package's own augmentation, loaded through the core types.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 4); ADR 0059.
 */
import type { DriverName } from "@stackra/container";
import { Port } from "@stackra/contracts";
import type { Json } from "@stackra/contracts";
import { StorageArea } from "@stackra/storage";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { QueryPersister } from "#contracts/ports/query-persister.port";
import type { QueryPersisterName } from "#core/types/query-persister-name.type";

describe("QueryPersister", () => {
  it("is a port a persister implements", async () => {
    class MapPersister extends QueryPersister {
      readonly isEncrypted = true;

      readonly kept = new Map<string, unknown>();

      read(area: StorageArea, key: string): Promise<Json | undefined> {
        return Promise.resolve(this.kept.get(`${area}:${key}`) as Json | undefined);
      }

      write(area: StorageArea, key: string, value: unknown): Promise<void> {
        this.kept.set(`${area}:${key}`, value);
        return Promise.resolve();
      }
    }
    const persister = new MapPersister();
    await persister.write(StorageArea.Outbox, "query.queue.usr_1", { version: 1 });
    await expect(persister.read(StorageArea.Outbox, "query.queue.usr_1")).resolves.toEqual({
      version: 1,
    });
    await expect(persister.read(StorageArea.Cache, "query.queue.usr_1")).resolves.toBeUndefined();
    expect(persister).toBeInstanceOf(QueryPersister);
    expect(persister).toBeInstanceOf(Port);
  });

  it("narrows DriverName to this port's drivers", () => {
    expectTypeOf<DriverName<QueryPersister>>().toEqualTypeOf<QueryPersisterName>();
    expectTypeOf<QueryPersisterName>().toEqualTypeOf<"storage">();
  });
});
