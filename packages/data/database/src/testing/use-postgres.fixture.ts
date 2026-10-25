/**
 * Stackra file contract:
 * Purpose: `usePostgres()`, the integration-tier fixture: one Testcontainers Postgres per test file, connected as
 *          `Database.current()`, with the compiled migrations applied once (or the schema created from the
 *          entities), and stopped after the file.
 * Boundary: registers `beforeAll` and `afterAll` from @stackra/testing; call it at the top level of a `.int.test.ts`
 *           file. Needs Docker, which only the integration task provides. Each compiled step runs as written: a
 *           transactional step in one transaction, an online step on its own.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3: domain helpers in the owner's `./testing`); ADR 0182 (integration tier);
 *                     ADR 0159.
 */
import { afterAll, beforeAll } from "@stackra/testing";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";

import { PostgresDatabaseDriver } from "#node/drivers/postgres-database.driver";
import type { PostgresFixture } from "#testing/types/postgres-fixture.type";
import type { UsePostgresOptions } from "#testing/types/use-postgres-options.type";

/** The default image: the current Postgres major. */
const IMAGE = "postgres:18-alpine";

/** How long pulling and starting the container may take. */
const BOOT_TIMEOUT_MS = 120_000;

/**
 * Starts Postgres for the test file.
 *
 * @example
 * usePostgres(); // one container for this file; the compiled migrations run once
 */
export function usePostgres(options: UsePostgresOptions = {}): PostgresFixture {
  const state: { container?: StartedPostgreSqlContainer; database?: PostgresDatabaseDriver } = {};
  beforeAll(async () => {
    state.container = await new PostgreSqlContainer(options.image ?? IMAGE).start();
    state.database = await PostgresDatabaseDriver.connect({
      url: state.container.getConnectionUri(),
      ...(options.entities === undefined ? {} : { entities: options.entities }),
    });
    const { schema } = state.database.orm;
    if (options.migrations === undefined) await schema.create();
    else
      for (const migration of options.migrations)
        for (const step of migration.steps)
          await schema.execute(step.sql.join(";\n"), { wrap: step.transactional });
  }, BOOT_TIMEOUT_MS);
  afterAll(async () => {
    await state.database?.close();
    await state.container?.stop();
  });
  return {
    get url(): string {
      if (state.container === undefined) throw new Error("usePostgres: read url inside a test");
      return state.container.getConnectionUri();
    },
    get database(): PostgresDatabaseDriver {
      if (state.database === undefined) throw new Error("usePostgres: read database inside a test");
      return state.database;
    },
  };
}
