/**
 * Stackra file contract:
 * Purpose: `overlayFloorIssues`, the publish check that an overlay never loosens a legal floor of its parent: on every
 *          day where the overlay replaces a key the parent holds as a floor, the overlay's entry must be a floor of
 *          the same bound and at least as strict (not below a `min`, not above a `max`; a non-numeric floor must be
 *          equal).
 * Boundary: pure over verified packs. The parent is resolved by the caller (`resolvePack` over the overlay's
 *           `extends`, with the statuses being published against), so the check covers every ancestor at any depth.
 *           Checks each day a value can change (an entry's start, the day after its end), which is every day that
 *           matters. Returns one issue per key and code, at the first day it happens; never throws.
 * Runtime: isomorphic
 * Governing contract: ADR 0417 (X2-19: a publish check refuses an overlay floor looser than its parent); ADR 0370
 *                     (decision 6); ADR 0363 (decision 4).
 */
import { FloorBound } from "#core/enums/floor-bound.enum";
import { PackIssueCode } from "#core/enums/pack-issue-code.enum";
import { canonicalJson } from "#core/functions/canonical-json.function";
import { valuesOn } from "#core/functions/values-on.function";
import type { MarketPack } from "#core/types/market-pack.type";
import type { PackEntry } from "#core/types/pack-entry.type";
import type { PackIssue } from "#core/types/pack-issue.type";
import type { ResolvedPack } from "#core/types/resolved-pack.type";

/** The day after `date`, as `YYYY-MM-DD`. */
const dayAfter = (date: string): string =>
  new Date(Date.parse(`${date}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);

/** The entry of `entries` in force on `on` (the latest start when several are). */
const inForce = (entries: readonly PackEntry[], on: string): PackEntry | undefined =>
  entries
    .filter((entry) => entry.from <= on && (entry.until === undefined || entry.until >= on))
    .reduce<PackEntry | undefined>(
      (held, entry) => (held === undefined || held.from < entry.from ? entry : held),
      undefined,
    );

/** True when `value` lets through something `floor` (of `bound`) refuses. */
const looser = (value: unknown, floor: unknown, bound: FloorBound): boolean => {
  if (typeof value === "number" && typeof floor === "number")
    return bound === FloorBound.Min ? value < floor : value > floor;
  // An unordered value cannot be shown to be as strict, so only the same value passes.
  return canonicalJson(value) !== canonicalJson(floor);
};

/**
 * The floor issues of `overlay` over `parent`.
 *
 * @example
 * const parent = resolvePack(packs, overlay.extends, { statuses: [PackStatus.Draft, PackStatus.Live] });
 * const issues = overlayFloorIssues(overlay, parent); // empty when no floor is loosened
 */
export function overlayFloorIssues(
  overlay: MarketPack,
  parent: ResolvedPack,
): readonly PackIssue[] {
  const byKey = new Map<string, PackEntry[]>();
  for (const entry of overlay.entries)
    byKey.set(entry.key, [...(byKey.get(entry.key) ?? []), entry]);
  const parentEntries = parent.layers.flatMap((layer) => layer.entries);
  const issues: PackIssue[] = [];
  for (const [key, entries] of byKey) {
    const days = new Set<string>();
    for (const entry of [...entries, ...parentEntries.filter((held) => held.key === key)]) {
      days.add(entry.from);
      if (entry.until !== undefined) days.add(dayAfter(entry.until));
    }
    const found = new Set<string>();
    for (const day of [...days].sort()) {
      const floor = valuesOn(parent, day).get(key);
      const own = inForce(entries, day);
      if (floor?.floor === undefined || own === undefined) continue;
      const code =
        own.floor?.bound !== floor.floor.bound
          ? PackIssueCode.FloorDropped
          : looser(own.value, floor.value, floor.floor.bound)
            ? PackIssueCode.FloorLoosened
            : undefined;
      if (code === undefined || found.has(code)) continue;
      found.add(code);
      issues.push({
        code,
        key,
        message:
          code === PackIssueCode.FloorDropped
            ? `${overlay.market} replaces the ${floor.floor.bound} floor of ${key} set by ${floor.market} (${floor.floor.law}) without the same floor on ${day}`
            : `${overlay.market} sets ${key} looser than the ${floor.floor.bound} floor of ${floor.market} (${floor.floor.law}) on ${day}`,
      });
    }
  }
  return issues;
}
