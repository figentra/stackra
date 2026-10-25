/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/database until `stackra gen` writes the entry barrels
 *          (STA-339): `Factory` and `Faker` for `database/factories/`, the `usePostgres()` fixture, and the plugin
 *          that adds `.seed(...)` and `app.transaction(...)` to the testing module.
 * Boundary: names each re-export and declares nothing; the plugin registers itself when its module loads, and
 *           `sideEffects` stays `false` because only tests load `./testing` and never tree-shake it. The only entry that
 *           imports Faker or Testcontainers, so a runtime entry never loads them (ADR 0269 decision 3).
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0269 (decision 3); the STA-347 stand-in barrel decision.
 */
export { Factory } from "#testing/bases/factory.base";
export { DATABASE_TESTING_PLUGIN } from "#testing/constants/database-testing-plugin.constant";
export type { Counted } from "#testing/types/counted.type";
export type { Faker } from "#testing/types/faker.type";
export type { PostgresFixture } from "#testing/types/postgres-fixture.type";
export type { UsePostgresOptions } from "#testing/types/use-postgres-options.type";
export { usePostgres } from "#testing/use-postgres.fixture";
