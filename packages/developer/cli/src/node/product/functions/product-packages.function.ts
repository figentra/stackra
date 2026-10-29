/**
 * Stackra file contract:
 * Purpose: `productPackages(root)`, every product package a root runway names on its surfaces and mobile apps, each
 *          once, in runway order.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0441 (decision 3).
 */
import type { RootRunway } from "@stackra/runway";

/**
 * The packages the product ships into its surfaces and apps.
 *
 * @example
 * productPackages(root); // ["@figentra/acme-example"]
 */
export function productPackages(root: RootRunway): string[] {
  const surfaces = Object.values(root.surfaces ?? {}).flatMap((entry) =>
    entry !== undefined && "packages" in entry ? (entry.packages ?? []) : [],
  );
  const mobile = Object.values(root.mobile ?? {}).flatMap((entry) => entry.packages ?? []);
  return [...new Set([...surfaces, ...mobile])];
}
