/**
 * Stackra file contract:
 * Purpose: `PackageIndexRecord`, one published package as the customer package index needs it: name, category and
 *          folder, `stackra.summary`, `exports` entries and `bin` commands.
 * Boundary: type only; `collectPackageIndex` fills it from package.json, `renderPackageIndex` reads it.
 * Runtime: node
 * Governing contract: ADR 0453 (amendment 2026-10-27: the stackra package fields); STA-2847.
 */

/** One published package, as the index needs it. */
export interface PackageIndexRecord {
  /** The npm name, `@stackra/<name>`. */
  readonly name: string;
  /** The category folder under `packages/` (`foundation`, `state`, …). */
  readonly category: string;
  /** The package folder under the category. */
  readonly folder: string;
  /** `package.json` `stackra.summary`: when to reach for the package. */
  readonly summary: string;
  /** The `exports` keys, without `./package.json`. */
  readonly entries: readonly string[];
  /** The `bin` command names, for a package that is a command rather than an import. */
  readonly commands?: readonly string[];
}
