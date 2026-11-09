/**
 * Stackra file contract:
 * Purpose: `checkZoneOwners(runways)`, the one-owner-per-zone check over every root runway a caller can see: a zone
 *          that two of them mark `owner: true` is reported once, naming both.
 * Boundary: pure; returns every failure instead of throwing. A single runway cannot see another, so only a caller that
 *           holds several (the stacks repository, a workspace scan) can call it. A zone nobody owns is not reported:
 *           the zone then has no policy, which is today's state.
 * Runtime: isomorphic
 * Governing contract: ADR 0519 (decision 5: exactly one root runway per zone sets `owner: true`); STA-1993.
 */
import type { RootRunway } from "#core/types/root-runway.type";
import type { ZoneOwnerIssue } from "#core/types/zone-owner-issue.type";

/**
 * Every zone claimed by more than one of `runways`, in zone-name order.
 *
 * @param runways - each root runway with a label for messages (its repository or path).
 * @example
 * checkZoneOwners([{ source: "core", root: a }, { source: "os", root: b }]);
 * // [{ code: "zone_owner_conflict", subject: "figentra.com", owners: ["core", "os"], message: "…" }]
 */
export function checkZoneOwners(
  runways: readonly { readonly source: string; readonly root: RootRunway }[],
): ZoneOwnerIssue[] {
  const owners = new Map<string, string[]>();
  for (const { source, root } of runways)
    for (const [zone, entry] of Object.entries(root.providers?.cloudflare?.zones ?? {}))
      if (typeof entry === "object" && entry.owner === true)
        owners.set(zone, [...(owners.get(zone) ?? []), source]);
  return (
    [...owners]
      .filter(([, sources]) => sources.length > 1)
      .map(([zone, sources]) => ({
        code: "zone_owner_conflict" as const,
        subject: zone,
        owners: sources,
        message: `${zone} is claimed by ${sources.join(" and ")}: exactly one root runway sets \`owner: true\``,
      }))
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here; toSorted is ES2023 and the base lib is ES2022
      .sort((a, b) => a.subject.localeCompare(b.subject))
  );
}
