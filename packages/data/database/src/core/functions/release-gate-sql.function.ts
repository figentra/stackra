/**
 * Stackra file contract:
 * Purpose: `releaseGateSql(after, step)`, the release gate of a contract step (ADR 0159 decision 3: a destructive step
 *          ships in a later release than the change that made it safe, so a running release never meets a dropped
 *          column): a `DO` block that refuses the migration unless the migration `after` was applied under another
 *          release than the one this run applies, and a `stackra db migrate` run of a release holding `after` has
 *          finished since. A retried deploy of the same release (a CI retry, a re-run pipeline) is refused as its first
 *          run was, and so is a later release while the run that applied `after` never finished (its code never went
 *          live, so the release before it may still read what the step removes).
 * Boundary: pure SQL text. It reads the runner's ledger (`schema_migrations_history`, with the `release_id` each step
 *           was applied under; `schema_migrations_releases`, each release whose run finished and the last file version
 *           it held), `MIGRATE_FROM_VERSION_SETTING` and `MIGRATE_RELEASE_SETTING`, which the runner sets in a
 *           forward-only environment. It passes where there is no older release to protect: no ledger table (Encore's
 *           runner on dev and staging, PGlite and `usePostgres` tests), the version setting unset (a rollback
 *           environment) or `0` (a fresh database). Otherwise it fails closed: a run that names no release is refused,
 *           since the gate cannot tell its release from the one that applied `after`, and so is a run whose release
 *           applied `after` (a release id reused across deploys holds the step until the id changes), and a run with
 *           no finished run of another release holding `after` (the releases table missing included). A step with no
 *           release (`release_id` null) counts as an older, serving release: the runner records none only for a file
 *           applied before the ledger kept releases, on a fresh database, or in a rollback environment, since a
 *           forward-only run on a database with applied files must name its release (`migrate`). The body's first line
 *           is the `CONTRACT_AFTER_MARKER` comment naming `after`, which `migrate` reads to refuse, before any change,
 *           a run that applies `after` and this step together. It has no blank line, so a runner that splits a step on
 *           blank lines keeps it whole, and it undoes nothing.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 3; the 2026-10-24 note: `stackra db migrate` is the release step, and
 *                     `schema_migrations_history`).
 */
import { CONTRACT_AFTER_MARKER } from "#core/constants/contract-after-marker.constant";
import { MIGRATE_FROM_VERSION_SETTING } from "#core/constants/migrate-from-version-setting.constant";
import { MIGRATE_RELEASE_SETTING } from "#core/constants/migrate-release-setting.constant";
import { MIGRATION_ID_PATTERN } from "#core/constants/migration-id-pattern.constant";
import { contractAfterFilePattern } from "#core/functions/contract-after-file-pattern.function";
import { sqlLiteral } from "#core/functions/sql-literal.function";

/**
 * The gate of the contract step `step` (`orders.orders drop column note`), after the migration `after`.
 *
 * @throws TypeError when `after` is not a migration id.
 * @example
 * releaseGateSql("orders.0007_stop_writing_note", "orders.orders drop column note");
 * // 'do $$\n-- stackra:contract-after=orders.0007_stop_writing_note\ndeclare\n...'
 */
export function releaseGateSql(after: string, step: string): string {
  if (typeof after !== "string" || !MIGRATION_ID_PATTERN.test(after))
    throw new TypeError(
      `${step}: { after } names the migration that shipped the earlier release, such as "orders.0007_stop_writing_note", got ${JSON.stringify(after)}`,
    );
  const file = sqlLiteral(contractAfterFilePattern(after));
  const [subject, waitsFor] = [sqlLiteral(step), sqlLiteral(after)];
  return [
    "do $$",
    `${CONTRACT_AFTER_MARKER}${after}`,
    "declare",
    "  after_version bigint;",
    "  after_applied timestamptz;",
    "  after_release text;",
    `  since text := nullif(current_setting(${sqlLiteral(MIGRATE_FROM_VERSION_SETTING)}, true), '');`,
    `  this_release text := nullif(current_setting(${sqlLiteral(MIGRATE_RELEASE_SETTING)}, true), '');`,
    "begin",
    "  if to_regclass('schema_migrations_history') is null or since is null or since = '0' then",
    "    return;",
    "  end if;",
    "  if this_release is null then",
    `    raise exception 'refused before any change: % is a contract step after %, and this run names no release to tell from the one that applied it: pass --release or set STACKRA_RELEASE', ${subject}, ${waitsFor};`,
    "  end if;",
    `  select version, applied_at, release_id into after_version, after_applied, after_release from schema_migrations_history where name ~ ${file} order by version desc limit 1;`,
    "  if not found then",
    `    raise exception 'refused before any change: % is a contract step after %, which is not applied; ship it in a later release', ${subject}, ${waitsFor};`,
    "  end if;",
    "  if after_release is null then",
    "    return;",
    "  end if;",
    "  if after_release = this_release then",
    `    raise exception 'refused before any change: % is a contract step after %, which release % applies; ship it in a later release', ${subject}, ${waitsFor}, this_release;`,
    "  end if;",
    "  if to_regclass('schema_migrations_releases') is not null then",
    "    perform 1 from schema_migrations_releases where release_id <> this_release and through_version >= after_version and finished_at >= after_applied;",
    "    if found then",
    "      return;",
    "    end if;",
    "  end if;",
    `  raise exception 'refused before any change: % is a contract step after %, which release % applied, and no migrate run of a release holding it has finished since, so the release before it may still be serving; ship the step in a release after one whose run finished', ${subject}, ${waitsFor}, after_release;`,
    "end",
    "$$",
  ].join("\n");
}
