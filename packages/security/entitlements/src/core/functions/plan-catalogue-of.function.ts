/**
 * Stackra file contract:
 * Purpose: `planCatalogueOf`, the `PlanCatalogue` a `plan-catalogue:<product>` version's rows hold. Each row names its
 *          `record`: `seat_kind` `{ key }`, `module` `{ key }`, `tier` `{ key, rank, features, limits, seats, modules }`
 *          or `trial` `{ tier, days, cardRequired }`. A row of any other record kind (`limit_policy`) is kept untouched
 *          in `extras` under its kind, so one version can hold a service's own rows beside the plan's.
 * Boundary: pure; it reads untrusted admin and seed rows, so a malformed row, a duplicate key, or a tier or trial that
 *           names an unknown seat kind, module or tier is a `RangeError` naming the row id. A `null` limit is
 *           unlimited. The admin calls it before every proposal, so a bad version is never stored.
 * Runtime: isomorphic
 * Governing contract: ADR 0391 (decisions 1 and 5); config-model section 2; stackra-117 (open catalogue records).
 */
import type { CatalogueRow, Json } from "@stackra/contracts";

import type { PlanCatalogue } from "#core/types/plan-catalogue.type";
import type { PlanTier } from "#core/types/plan-tier.type";
import type { TrialTerms } from "#core/types/trial-terms.type";

/** A row as stored. */
type Row = CatalogueRow;

/** The row's text field, or a `RangeError`. */
function text(row: Row, field: string): string {
  const value = row[field];
  if (typeof value !== "string" || value.length === 0)
    throw new RangeError(`planCatalogueOf: row ${String(row.id)} needs text ${field}`);
  return value;
}

/** The row's whole number at or above zero (`null` is unlimited when `unlimited` allows it), or a `RangeError`. */
function count(row: Row, value: Json | undefined, field: string, unlimited = false): number {
  if (value === null && unlimited) return Number.POSITIVE_INFINITY;
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0)
    throw new RangeError(`planCatalogueOf: row ${String(row.id)} needs a whole ${field}`);
  return value;
}

/** The row's list of texts (absent is empty), or a `RangeError`. */
function texts(row: Row, field: string): readonly string[] {
  const value = row[field] ?? [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string"))
    throw new RangeError(
      `planCatalogueOf: row ${String(row.id)} needs a list of texts in ${field}`,
    );
  return Object.freeze([...(value as string[])]);
}

/** The row's map of counts (absent is empty), or a `RangeError`. */
function counts(row: Row, field: string, unlimited: boolean): Readonly<Record<string, number>> {
  const value = row[field] ?? {};
  if (typeof value !== "object" || value === null || Array.isArray(value))
    throw new RangeError(`planCatalogueOf: row ${String(row.id)} needs a map in ${field}`);
  return Object.freeze(
    Object.fromEntries(
      Object.entries(value).map(([key, held]) => [
        key,
        count(row, held, `${field}.${key}`, unlimited),
      ]),
    ),
  );
}

/** Refuses `key` when `seen` holds it already, then records it. */
function unique(seen: Set<string>, key: string, row: Row): void {
  if (seen.has(key)) throw new RangeError(`planCatalogueOf: row ${String(row.id)} repeats ${key}`);
  seen.add(key);
}

/**
 * The catalogue `rows` hold.
 *
 * @throws RangeError for a row with no `record`, a malformed row, a duplicate key, or a reference to an unknown seat kind, module or tier.
 * @example
 * const catalogue = planCatalogueOf((await admin.inForce("plan-catalogue:commerce", termStart))!.rows);
 */
export function planCatalogueOf(rows: readonly Row[]): PlanCatalogue {
  const seatKinds = new Set<string>();
  const modules = new Set<string>();
  const tierKeys = new Set<string>();
  const tiers: PlanTier[] = [];
  const trials: TrialTerms[] = [];
  // a null prototype, so an untrusted `__proto__` record kind stays a plain key
  const extras: Record<string, Row[]> = Object.create(null);
  for (const row of rows) {
    const record = text(row, "record");
    if (record === "seat_kind") unique(seatKinds, text(row, "key"), row);
    else if (record === "module") unique(modules, text(row, "key"), row);
    else if (record === "tier") {
      const key = text(row, "key");
      unique(tierKeys, key, row);
      tiers.push(
        Object.freeze({
          key,
          rank: count(row, row.rank, "rank"),
          features: texts(row, "features"),
          limits: counts(row, "limits", true),
          seats: counts(row, "seats", false),
          modules: texts(row, "modules"),
        }),
      );
    } else if (record === "trial") {
      if (typeof row.cardRequired !== "boolean")
        throw new RangeError(`planCatalogueOf: row ${String(row.id)} needs cardRequired`);
      trials.push(
        Object.freeze({
          tier: text(row, "tier"),
          days: count(row, row.days, "days"),
          cardRequired: row.cardRequired,
        }),
      );
    } else (extras[record] ??= []).push(Object.freeze({ ...row }));
  }
  for (const tier of tiers) {
    for (const kind of Object.keys(tier.seats))
      if (!seatKinds.has(kind))
        throw new RangeError(`planCatalogueOf: tier ${tier.key} names unknown seat kind ${kind}`);
    for (const module of tier.modules)
      if (!modules.has(module))
        throw new RangeError(`planCatalogueOf: tier ${tier.key} names unknown module ${module}`);
  }
  for (const trial of trials)
    if (!tierKeys.has(trial.tier))
      throw new RangeError(`planCatalogueOf: a trial names unknown tier ${trial.tier}`);
  return Object.freeze({
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    tiers: Object.freeze(tiers.sort((a, b) => a.rank - b.rank)),
    seatKinds: Object.freeze([...seatKinds].map((key) => Object.freeze({ key }))),
    modules: Object.freeze([...modules].map((key) => Object.freeze({ key }))),
    trials: Object.freeze(trials),
    extras: Object.freeze(
      Object.fromEntries(Object.entries(extras).map(([kind, held]) => [kind, Object.freeze(held)])),
    ),
  });
}
