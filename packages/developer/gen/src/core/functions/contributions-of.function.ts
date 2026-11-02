/**
 * Stackra file contract:
 * Purpose: `contributionsOf(ir, read, same)`, one section of what a host's dependencies contribute, read from their
 *          committed manifests: each declared package (an app's manifest aside) and each consumed service, in that
 *          order, every entry keyed and tagged with the member it came from. The same entry reached twice (a package
 *          declared directly and hosted by a consumed service) is kept once; one key from two different owners is a
 *          duplicate the caller refuses.
 * Boundary: pure. `read` picks the section out of a manifest, so each kind (resources, routes, menus, commands) keeps
 *           its own reader and emitter and only the walk is shared; `same` says when two entries are one contribution.
 * Runtime: isomorphic
 * Governing contract: ADR 0111 (decisions 3 and 4: gen collects contributions per module, a package module contributes
 *                     like a service module); ADR 0109 (decision 1); STA-1947.
 */
import type { StackraManifest } from "@stackra/contracts";

import type { Contribution } from "#core/types/contribution.type";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The entries of one section across `ir`'s dependencies and consumed services, first owner per key, sorted by key.
 *
 * @param ir - the host read by discovery.
 * @param read - the section's entries in one manifest, each with its key.
 * @param same - whether two entries under one key are the same contribution reached twice.
 * @example
 * const { entries, duplicates } = contributionsOf(ir, (manifest) => Object.entries(resourcesIn(manifest)), sameClass);
 */
export function contributionsOf<T>(
  ir: MemberIR,
  read: (manifest: StackraManifest) => readonly (readonly [string, T])[],
  same: (left: T, right: T) => boolean,
): {
  readonly entries: readonly Contribution<T>[];
  readonly duplicates: readonly {
    readonly first: Contribution<T>;
    readonly second: Contribution<T>;
  }[];
} {
  const found = new Map<string, Contribution<T>>();
  const duplicates: { first: Contribution<T>; second: Contribution<T> }[] = [];
  const sources = [
    ...ir.dependencies
      .filter(({ manifest }) => manifest["kind"] !== "app")
      .map(({ package: from, manifest }) => ({ from, manifest })),
    ...(ir.services ?? []).map(({ member: from, manifest }) => ({ from, manifest })),
  ];
  for (const { from, manifest } of sources)
    for (const [key, entry] of read(manifest)) {
      const first = found.get(key);
      if (first === undefined) found.set(key, { key, entry, from });
      else if (!same(first.entry, entry)) duplicates.push({ first, second: { key, entry, from } });
    }
  return {
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    entries: [...found.values()].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0)),
    duplicates,
  };
}
