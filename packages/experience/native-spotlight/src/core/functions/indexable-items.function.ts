/**
 * Stackra file contract:
 * Purpose: `indexableItems`, the visibility rules of the phone's search: of the offered records, only the signed-in
 *          person's own, of a kind the configuration lists, not sensitive, changed within `maxAgeDays`, newest first
 *          and at most `maxItems`, become search entries.
 * Boundary: pure; it reads the configuration's values and the clock it is given. Nothing is indexed while the
 *           configuration is off or nobody is signed in (`userId` null). A record with no deep link is dropped,
 *           since an entry that opens nothing is no use.
 * Runtime: isomorphic
 * Governing contract: ADR 0333 (the server's visibility comes first; this only narrows); ADR 0478.
 */
import type { DeviceSearchItem } from "#contracts/types/device-search-item.type";
import type { SpotlightOptions } from "#core/schemas/spotlight-options.schema";
import type { DeviceSearchRecord } from "#core/types/device-search-record.type";

/** One day in milliseconds. */
const DAY = 86_400_000;

/**
 * The entries the rules allow of `records`.
 *
 * @example
 * const items = indexableItems(config, session.user?.id ?? null, records, new Date());
 */
export function indexableItems(
  rules: Pick<SpotlightOptions, "isEnabled" | "kinds" | "maxItems" | "maxAgeDays">,
  userId: string | null,
  records: readonly DeviceSearchRecord[],
  now: Date,
): DeviceSearchItem[] {
  if (!rules.isEnabled || userId === null) return [];
  const kinds = new Set(rules.kinds);
  const oldest = now.getTime() - rules.maxAgeDays * DAY;
  return records
    .map((record) => ({ record, at: Date.parse(record.updatedAt) }))
    .filter(
      ({ record, at }) =>
        record.ownerId === userId &&
        !record.isSensitive &&
        kinds.has(record.kind) &&
        record.url !== "" &&
        at >= oldest,
    )
    .toSorted((a, b) => b.at - a.at)
    .slice(0, rules.maxItems)
    .map(({ record: { url, kind, title, description, keywords } }) => ({
      url,
      kind,
      title,
      description,
      keywords,
    }));
}
