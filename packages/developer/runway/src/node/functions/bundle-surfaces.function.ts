/**
 * Stackra file contract:
 * Purpose: `bundleSurfaces(root)`, the web surfaces of a root runway that ship an extension bundle: every surface
 *          except `ops` that lists `packages`, sorted.
 * Boundary: pure. A surface without packages (a landing site of seed `content` only) ships no bundle; `ops`
 *           contributions are declarative and go through the ops release, not here.
 * Runtime: node
 * Governing contract: ADR 0436 (decision 4); app-shells 8.2 and 8.3.
 */
import type { RootRunway } from "#core/types/root-runway.type";

/**
 * The surface keys that build a bundle.
 *
 * @example
 * bundleSurfaces(root); // ["console", "till"]
 */
export function bundleSurfaces(root: RootRunway): string[] {
  return (
    Object.keys(root.surfaces ?? {})
      .filter(
        (surface) => surface !== "ops" && (root.surfaces?.[surface]?.packages?.length ?? 0) > 0,
      )
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort()
  );
}
