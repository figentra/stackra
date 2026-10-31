/**
 * Stackra file contract:
 * Purpose: `specComputedTier(changes)`, the lowest tier a diff allows, with the reasons: a migration, a public contract,
 *          a permission, payment or money code, or a new app or Worker member forces at least `feature`; a new service
 *          or package forces `big`; anything else allows `trivial`.
 * Boundary: pure over `git diff --name-status` rows; a spec folder, docs and tests raise nothing on their own.
 * Runtime: node
 * Governing contract: ADR 0502 (spec tiers and approval stops); ADR 0120; ADR 0362. Loaded by plain Node from source
 *                     by core's `tools/scripts` wrappers, so it imports values by relative `.ts` paths and uses
 *                     erasable TypeScript only (ADR 0421 decision 2).
 */

/** A path pattern that raises the floor to `tier`, and why. */
interface Floor {
  readonly tier: string;
  readonly why: string;
  readonly match: (status: string, path: string) => boolean;
}

/** The floors, highest first. */
const FLOORS: readonly Floor[] = [
  {
    tier: "big",
    why: "a new service or package",
    match: (status, path) =>
      status.startsWith("A") &&
      /^(?:services\/[^/]+|packages\/(?!tooling\/)[^/]+\/[^/]+)\/package\.json$/.test(path),
  },
  {
    tier: "feature",
    why: "a new app or Worker member",
    match: (status, path) =>
      status.startsWith("A") && /^(?:apps|workers)\/[^/]+\/package\.json$/.test(path),
  },
  {
    tier: "feature",
    why: "a migration",
    match: (_status, path) => /\/database\/migrations\/|\.migration\.ts$/.test(path),
  },
  {
    tier: "feature",
    why: "a public contract",
    match: (_status, path) =>
      /\/src\/contracts\/|(?:^|\/)(?:stackra\.manifest|openapi)\.json$/.test(path),
  },
  {
    tier: "feature",
    why: "a permission",
    match: (_status, path) => /\.permissions\.ts$|\/access\//.test(path),
  },
  {
    tier: "feature",
    why: "payment or money code",
    match: (_status, path) =>
      path.startsWith("packages/commerce/") ||
      /(?:^|[/.-])(?:payments?|money|ledgers?|billing|payouts?|refunds?)(?:[/.-]|$)/i.test(path),
  },
];

/** Paths that never raise the floor: specs, docs, tests and changesets. */
const NEUTRAL = /^\.agents\/specs\/|^\.changeset\/|^apps\/docs\/|\.mdx?$|\/__tests__\//;

/**
 * The lowest tier `changes` allow, and the paths that set it.
 *
 * @param changes - the `git diff --name-status` rows (`A`, `M`, `D`, `R100`), each with its path.
 * @example
 * specComputedTier([{ status: "A", path: "services/orders/src/modules/orders/database/migrations/0001-x.migration.ts" }]);
 * // { tier: "feature", reasons: ["a migration: services/orders/..."] }
 */
export function specComputedTier(
  changes: readonly { readonly status: string; readonly path: string }[],
): { tier: string; reasons: string[] } {
  let tier = "trivial";
  const reasons: string[] = [];
  for (const floor of FLOORS) {
    const hits = changes.filter(
      ({ status, path }) => !NEUTRAL.test(path) && floor.match(status, path),
    );
    if (hits.length === 0) continue;
    if (tier === "trivial") tier = floor.tier;
    if (floor.tier === tier)
      reasons.push(
        `${floor.why}: ${hits
          .map((h) => h.path)
          .slice(0, 3)
          .join(", ")}${hits.length > 3 ? ", …" : ""}`,
      );
  }
  return { tier, reasons };
}
