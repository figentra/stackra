/**
 * Stackra file contract:
 * Purpose: `destructiveOf(migrations)`, the deploy evidence's `destructive` and `destructiveMigrations` from gen's
 *          ADR 0159 classes: `true` with the ids when a destructive (contract or banned) migration is carried, that is
 *          missing from the previous deploy's keys; `false` when every stream is classified, its classes match its
 *          compiled files, and nothing destructive is carried (or no stream holds a destructive migration at all);
 *          `null` when a stream's safety file is missing, unreadable or stale against its compiled files, or when a
 *          destructive migration exists and no previous keys say whether it shipped before.
 * Boundary: pure. Never guesses a `false`: an unknown is `null`; a `true` is reported even beside an unknown stream,
 *           since it is floor either way.
 * Runtime: isomorphic
 * Governing contract: ADR 0533 (decision 3: destructive migrations are floor, by gen's classification); ADR 0159
 *                     (decision 3; the 2026-10-23 note: Additive, Online, Contract, Banned); STA-2866.
 */
import { streamIsCurrent } from "#core/functions/stream-is-current.function";
import type { DeployEvidence } from "#core/types/deploy-evidence.type";
import type { DeployMigrations } from "#core/types/deploy-migrations.type";

/**
 * Whether the deploy carries a destructive migration.
 *
 * @example
 * destructiveOf({ streams: [billing], previous: ["billing:billing.0001_create_invoices"] });
 * // { destructive: true, destructiveMigrations: ["billing.0002_drop_note"] }
 */
export function destructiveOf(
  migrations: DeployMigrations | undefined,
): Pick<DeployEvidence, "destructive" | "destructiveMigrations"> {
  const unknown = { destructive: null, destructiveMigrations: [] } as const;
  if (migrations === undefined) return unknown;
  const previous = migrations.previous === undefined ? undefined : new Set(migrations.previous);
  const carried = new Set<string>();
  let known = true;
  for (const stream of migrations.streams) {
    if (!streamIsCurrent(stream)) {
      known = false;
      continue;
    }
    for (const row of stream.safety?.migrations ?? []) {
      if (!row.destructive) continue;
      // Without the previous deploy's keys, whether this one shipped before is unknown.
      if (previous === undefined) known = false;
      else if (!previous.has(`${stream.member}:${row.id}`)) carried.add(row.id);
    }
  }
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  if (carried.size > 0) return { destructive: true, destructiveMigrations: [...carried].sort() };
  return known ? { destructive: false, destructiveMigrations: [] } : unknown;
}
