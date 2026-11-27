/**
 * Stackra file contract:
 * Purpose: `releaseGateSql(after, step)`, the release gate of a contract step (ADR 0159 decision 3: a destructive step
 *          ships in a later release than the change that made it safe, so a running release never meets a dropped
 *          column): a `DO` block that refuses the migration unless the migration `after` was applied under another
 *          release than the one this run applies, and the migrate run of another release that finished last holds
 *          `after` and finished after it was applied. A retried deploy of the same release (a CI retry, a re-run
 *          pipeline) is refused as its first run was, and so is a later release while the run that applied `after`
 *          never finished (its code never went live, so the release before it may still read what the step removes),
 *          or once an older release that never held `after` finished a run after it (a rollback: that older release is
 *          serving again).
 * Boundary: pure SQL text. It reads the runner's ledger (`schema_migrations_history`, with the `release_id` each step
 *           was applied under; `schema_migrations_releases`, each release whose run finished, when it last did, and
 *           the last file version it held), `MIGRATE_FROM_VERSION_SETTING` and `MIGRATE_RELEASE_SETTING`, which the
 *           runner sets in a forward-only environment. "Finished" means the release's `stackra db migrate` run
 *           applied every pending file, so a pipeline runs migrate right before it rolls that release out. It passes
 *           where there is no older release to protect: no ledger table (Encore's runner on dev and staging, PGlite
 *           and `usePostgres` tests), the version setting unset (a rollback environment) or `0` (a fresh database).
 *           Otherwise it fails closed: a run that names no release is refused, and so is a run whose release applied
 *           `after` (a release id reused across deploys holds the step until the id changes), and a run where the
 *           last finished run of another release does not hold `after` or finished before it was applied (the
 *           releases table missing, or empty, included). Who applied `after` does not loosen the gate: a step
 *           recorded with no release (applied before the ledger kept releases, or by a run naming none) waits for a
 *           finished run that holds it like any other. The body's first line is the `CONTRACT_AFTER_MARKER` comment
 *           naming `after`, which `migrate` reads to refuse, before any change, a run that applies `after` and this
 *           step together, or that holds this step and names no release. It has no blank line, so a runner that
 *           splits a step on blank lines keeps it whole, and it undoes nothing.
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
    "  last_release text;",
    "  last_through bigint;",
    "  last_finished timestamptz;",
    `  since text := nullif(current_setting(${sqlLiteral(MIGRATE_FROM_VERSION_SETTING)}, true), '');`,
    `  this_release text := nullif(current_setting(${sqlLiteral(MIGRATE_RELEASE_SETTING)}, true), '');`,
    "begin",
    "  if to_regclass('schema_migrations_history') is null or since is null or since = '0' then",
    "    return;",
    "  end if;",
    "  if this_release is null then",
    `    raise exception 'refused before any change: % is a contract step after %, and this run names no release to tell from the one that applied it: pass --release <version or commit> to stackra db migrate, or set STACKRA_RELEASE=<version or commit> in the release step', ${subject}, ${waitsFor};`,
    "  end if;",
    `  select version, applied_at, release_id into after_version, after_applied, after_release from schema_migrations_history where name ~ ${file} order by version desc limit 1;`,
    "  if not found then",
    `    raise exception 'refused before any change: % is a contract step after %, which is not applied; ship it in a later release', ${subject}, ${waitsFor};`,
    "  end if;",
    "  if after_release = this_release then",
    `    raise exception 'refused before any change: % is a contract step after %, which release % applies; ship it in a later release', ${subject}, ${waitsFor}, this_release;`,
    "  end if;",
    "  if to_regclass('schema_migrations_releases') is not null then",
    "    select release_id, through_version, finished_at into last_release, last_through, last_finished from schema_migrations_releases where release_id <> this_release order by finished_at desc, through_version desc limit 1;",
    "    if found and last_through >= after_version and last_finished >= after_applied then",
    "      return;",
    "    end if;",
    "  end if;",
    `  raise exception 'refused before any change: % is a contract step after %, which release % applied, and the last migrate run of another release to finish (%) does not hold it, so the release before it may still be serving; ship the step in a release after one holding it whose run finished last', ${subject}, ${waitsFor}, coalesce(after_release, '(none named)'), coalesce(last_release, 'none');`,
    "end",
    "$$",
  ].join("\n");
}
