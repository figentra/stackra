/**
 * Stackra file contract:
 * Purpose: `deprecationsOf`, the manifest's `deprecations` section: one entry per `@Deprecated` class (its kind code),
 *          per `@Deprecated` field (`field`, or `setting` on a settings group) and per trait deprecated through
 *          `createTrait`'s `deprecated` option (`trait`), with the module, the locked identity when the kind has one
 *          (an action's key, an event's wire name, a trait's code), since, sunset and replacement.
 * Boundary: pure and deterministic: sorted by name, then member (the class first), then kind. Reads the member's own
 *           classes, shapes and traits only; a hosted package's deprecations stay in its own manifest, which a
 *           consumer's gen reads.
 * Runtime: isomorphic
 * Governing contract: ADR 0131 (decision 4: gen records the deprecation in the manifest); ADR 0294 (decision 10:
 *                     the committed manifest); STA-2836.
 */
import type { Deprecation, Json } from "@stackra/contracts";

import type { MemberIR } from "#core/types/member-ir.type";

/** A manifest entry. */
type Entry = { [key: string]: Json };

/** The entry fields a deprecation adds. */
const fieldsOf = (deprecation: Deprecation): Entry => ({
  since: deprecation.since,
  sunset: deprecation.sunset,
  ...(deprecation.replacement !== undefined ? { replacement: deprecation.replacement } : {}),
});

/**
 * The `deprecations` section of `ir`'s manifest; `[]` when the member deprecates nothing.
 *
 * @param ir - the member.
 * @param identities - the locked identity of each own class that has one (`CancelOrderAction` →
 *   `orders.order.cancel@1`), read from the manifest's actions and events.
 * @example
 * deprecationsOf(ir, new Map([["CancelOrderAction", "orders.order.cancel@1"]]));
 * // [{ kind: "action", name: "CancelOrderAction", module: "orders", identity: "orders.order.cancel@1", since: "0.34.0", sunset: "0.35.0" }]
 */
export function deprecationsOf(ir: MemberIR, identities: ReadonlyMap<string, string>): Entry[] {
  const entries: Entry[] = [];
  for (const declared of ir.classes)
    if (declared.deprecated !== undefined) {
      const identity = identities.get(declared.name);
      entries.push({
        kind: declared.kind,
        name: declared.name,
        module: declared.module,
        ...(identity !== undefined ? { identity } : {}),
        ...fieldsOf(declared.deprecated),
      });
    }
  for (const shape of ir.shapes)
    for (const field of shape.fields)
      if (field.deprecated !== undefined)
        entries.push({
          kind: shape.kind === "settings" ? "setting" : "field",
          name: shape.name,
          member: field.name,
          module: shape.module,
          ...fieldsOf(field.deprecated),
        });
  for (const trait of ir.deprecatedTraits ?? [])
    entries.push({
      kind: "trait",
      name: trait.name,
      module: trait.module,
      identity: trait.code,
      ...fieldsOf(trait.deprecated),
    });
  const order = (entry: Entry): string =>
    `${String(entry["name"])}\u0000${String(entry["member"] ?? "")}\u0000${String(entry["kind"])}`;
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  return entries.sort((left, right) =>
    order(left) < order(right) ? -1 : order(left) > order(right) ? 1 : 0,
  );
}
