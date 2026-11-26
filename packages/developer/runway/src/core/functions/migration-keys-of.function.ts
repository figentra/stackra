/**
 * Stackra file contract:
 * Purpose: `migrationKeysOf(migrations)`, the `<member>:<id>` key of every migration a deploy job ships, sorted, which
 *          `runway evidence` writes to `runway-migrations-<environment>[-<member>].json` so the next deploy to the
 *          environment can pass it back as `--previous` and `destructiveOf` can tell what is new.
 * Boundary: pure. `undefined` when any stream is not current (`streamIsCurrent`): an unknown stream is never recorded
 *           as shipped.
 * Runtime: isomorphic
 * Governing contract: ADR 0533 (decision 3); ADR 0159 (decision 3); STA-2866.
 */
import { streamIsCurrent } from "#core/functions/stream-is-current.function";
import type { DeployMigrations } from "#core/types/deploy-migrations.type";

/**
 * The keys the deploy ships.
 *
 * @example
 * migrationKeysOf({ streams: [billing] }); // ["billing:billing.0001_create_invoices"]
 */
export function migrationKeysOf(migrations: DeployMigrations): string[] | undefined {
  if (!migrations.streams.every((stream) => streamIsCurrent(stream))) return undefined;
  return (
    migrations.streams
      .flatMap((stream) =>
        (stream.safety?.migrations ?? []).map((row) => `${stream.member}:${row.id}`),
      )
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort()
  );
}
