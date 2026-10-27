/**
 * Stackra file contract:
 * Purpose: `openSettingsSession(scope, run)`, the connection the `settings:diff` and `settings:apply` runner shares:
 *          the member's database connected, a scope session at the target node, and a `SettingsPackService` over the
 *          Postgres value and revision stores, closed when `run` ends. Floors come from the holder's resolved market
 *          pack when the caller passes it, else from the fail-closed floor guard.
 * Boundary: the connection string is the `DATABASE_URL` the member's runway and config put in the environment, never
 *           an argument. Every read and write runs inside `withScope(scope)`, so row-level security limits it to that
 *           node and its ancestors, and one transaction holds the whole run.
 * Runtime: node
 * Governing contract: ADR 0213 (decision 4: `settings:diff` and `settings:apply`); ADR 0395 (decision 5); ADR 0327
 *                     (decisions 3 and 9); ADR 0419 (decision 2: the runner takes the holder's market).
 */
import { Container } from "@stackra/container";
import { Clock, type ScopeRef } from "@stackra/contracts";
import type { ResolvedPack } from "@stackra/market-packs";
import { PostgresDatabaseDriver } from "@stackra/database/node";

import {
  MarketPackSettingFloorSourceDriver,
  SettingsPackService,
  SettingsResolver,
} from "#core/index";
import { PostgresSettingRevisionStoreDriver } from "#node/drivers/postgres-setting-revision-store.driver";
import { PostgresSettingValueStoreDriver } from "#node/drivers/postgres-setting-value-store.driver";
import { RegisteredFloorGuardDriver } from "#node/drivers/registered-floor-guard.driver";
import { StoredSettingRevisionService } from "#node/services/stored-setting-revision.service";
import { StoredSettingService } from "#node/services/stored-setting.service";

/**
 * Opens a settings session at `scope` for `run`, with `market` the holder's resolved pack when known.
 *
 * @throws Error when `DATABASE_URL` is not set or Postgres refuses the connection.
 * @example
 * await openSettingsSession(scope, (packs) => packs.exportPack({ scope }, ["orders"]));
 */
export async function openSettingsSession<T>(
  scope: ScopeRef,
  run: (packs: SettingsPackService) => Promise<T>,
  market?: ResolvedPack,
): Promise<T> {
  const url = process.env["DATABASE_URL"];
  if (url === undefined || url === "") throw new Error("DATABASE_URL is not set for this member");
  // the container's default Clock: the system driver is not exported, so a host can replace it without being named
  const clock = (await Container.create([])).get(Clock);
  const database = await PostgresDatabaseDriver.connect({ url });
  try {
    return await database.withScope(scope, () => {
      const store = new PostgresSettingValueStoreDriver(new StoredSettingService());
      const revisions = new PostgresSettingRevisionStoreDriver(new StoredSettingRevisionService());
      const floors =
        market === undefined
          ? new RegisteredFloorGuardDriver()
          : MarketPackSettingFloorSourceDriver.over(market, clock);
      const resolver = new SettingsResolver(store, floors, revisions, clock);
      return run(new SettingsPackService(store, resolver));
    });
  } finally {
    await database.close();
  }
}
