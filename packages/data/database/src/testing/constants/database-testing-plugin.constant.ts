/**
 * Stackra file contract:
 * Purpose: `DATABASE_TESTING_PLUGIN`, the testing-module plugin of @stackra/database: every compile connects a fresh
 *          `MemoryDatabaseDriver` (PGlite) unless another database is connected, `.seed(...seeders)` runs each seeder
 *          in its own transaction once the module compiles, `app.transaction(work)` runs work in a transaction of the
 *          connected database, and `app.repository(Model)` hands out the model's repository. All are declared on the
 *          testing module here and registered when this module loads.
 * Boundary: the memory database is the unit tier's default, so `useDrivers("memory")` tests reach a database whether
 *           or not their wiring lists the port's candidates. A database connected another way wins: `usePostgres()`
 *           (connected before the module compiles) or a driver the container built for this module. A memory database
 *           this plugin or an earlier module connected is replaced and closed, so each testing module starts empty.
 *           `app.repository` reads the container's `repositoryOf(Model)` binding when the wiring has one, else builds
 *           the token, which has no dependencies.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0190 (seed profiles); ADR 0263 (decision 12); ADR 0266 (memory
 *                     first); ADR 0145 and ADR 0294 (classes are the only tokens).
 */
import { registerTestingPlugin } from "@stackra/container/testing";
import type { TestingModuleBuilder, TestingPlugin } from "@stackra/container/testing";
import type { AnyClass } from "@stackra/container";

import type { Seeder } from "#core/bases/seeder.base";
import { ACTIVE_DATABASE } from "#core/constants/active-database.constant";
import { repositoryOf } from "#core/functions/repository-of.function";
import { Database } from "#core/ports/database.port";
import type { Repository } from "#core/types/repository.type";
import { MemoryDatabaseDriver } from "#testing/drivers/memory-database.driver";

declare module "@stackra/container/testing" {
  interface TestingModuleBuilder {
    /** Runs each seeder, in order and each in its own transaction, once the module compiles. */
    seed(...seeders: readonly (new () => Seeder)[]): this;
  }

  interface TestingApp {
    /** Runs `work` in a transaction of the connected database, as an action's unit of work would. */
    transaction<T>(work: () => Promise<T>): Promise<T>;

    /** The repository of `model`, reading and writing the connected database. */
    repository<M extends object>(model: AnyClass<M>): Repository<M>;
  }
}

/** The database the last compile left connected. */
let connected: Database | undefined;

/** Connects a fresh memory database unless another one is connected, closing the memory one an earlier module left. */
function connectDatabase(): void {
  const current = ACTIVE_DATABASE.current;
  const stale = current === connected && current instanceof MemoryDatabaseDriver;
  if (current === undefined || stale) {
    connected = new MemoryDatabaseDriver();
    // A failed close of a database no test reads any more must not fail this one.
    if (stale) void current.close().catch(() => undefined);
  } else connected = current;
}

/**
 * The plugin; registered with the testing module when this module loads.
 *
 * @example
 * const app = await createTestingModule(LoyaltyKitModule).seed(LoyaltyKitDemoSeeder).compile();
 * await app.transaction(() => accounts.earn(member, request));
 * expect(await app.repository(LoyaltyAccount).count({})).toBe(1);
 */
export const DATABASE_TESTING_PLUGIN: TestingPlugin = {
  name: "@stackra/database",
  builder: {
    seed(this: TestingModuleBuilder, ...seeders: readonly (new () => Seeder)[]) {
      return this.onCompile(async () => {
        for (const SeederClass of seeders)
          await Database.current().transaction(() => new SeederClass().run());
      });
    },
  },
  app: (app) => {
    connectDatabase();
    return {
      transaction: <T>(work: () => Promise<T>): Promise<T> => Database.current().transaction(work),
      repository: <M extends object>(model: AnyClass<M>): Repository<M> => {
        const token = repositoryOf(model);
        return app.has(token) ? app.get(token) : (Reflect.construct(token, []) as Repository<M>);
      },
    };
  },
};

registerTestingPlugin(DATABASE_TESTING_PLUGIN);
