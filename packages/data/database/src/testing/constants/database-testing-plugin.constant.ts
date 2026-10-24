/**
 * Stackra file contract:
 * Purpose: `DATABASE_TESTING_PLUGIN`, the testing-module plugin of @stackra/database: `.seed(...seeders)` runs each
 *          seeder in its own transaction once the module compiles, and `app.transaction(work)` runs work in a
 *          transaction of the connected database. Both are declared on the testing module here and registered when
 *          this module loads.
 * Boundary: uses `Database.current()`, so it needs `usePostgres()` (or another connected database) in the file.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0190 (seed profiles); ADR 0263 (decision 12).
 */
import { registerTestingPlugin } from "@stackra/container/testing";
import type { TestingModuleBuilder, TestingPlugin } from "@stackra/container/testing";

import type { Seeder } from "#core/bases/seeder.base";
import { Database } from "#core/ports/database.port";

declare module "@stackra/container/testing" {
  interface TestingModuleBuilder {
    /** Runs each seeder, in order and each in its own transaction, once the module compiles. */
    seed(...seeders: readonly (new () => Seeder)[]): this;
  }

  interface TestingApp {
    /** Runs `work` in a transaction of the connected database, as an action's unit of work would. */
    transaction<T>(work: () => Promise<T>): Promise<T>;
  }
}

/**
 * The plugin; registered with the testing module when this module loads.
 *
 * @example
 * const app = await createTestingModule(LoyaltyKitModule).seed(LoyaltyKitDemoSeeder).compile();
 * await app.transaction(() => accounts.earn(member, request));
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
  app: () => ({
    transaction: <T>(work: () => Promise<T>): Promise<T> => Database.current().transaction(work),
  }),
};

registerTestingPlugin(DATABASE_TESTING_PLUGIN);
