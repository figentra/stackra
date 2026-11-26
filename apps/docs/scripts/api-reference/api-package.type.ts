/**
 * Stackra file contract:
 * Purpose: `ApiPackage`, one published `@stackra` package as the API reference shows it: name, version, category,
 *          summary, runtimes, source link and entry points.
 * Boundary: data only; `listPackages` fills it from `package.json` and `readPackageApis` adds the symbols.
 * Runtime: node
 * Governing contract: ADR 0453 (amendment 2026-10-27: the stackra package fields); STA-2857.
 */
import type { ApiEntry } from "#scripts/api-reference/api-entry.type";

/** One published package. */
export interface ApiPackage {
  /** The package name (`@stackra/money`). */
  readonly name: string;
  /** The version in `package.json`. */
  readonly version: string;
  /** The `stackra.category`, else the folder under `packages/`. */
  readonly category: string;
  /** The `stackra.summary`: when to use the package. */
  readonly summary: string;
  /** The `stackra.runtimes`. */
  readonly runtimes: readonly string[];
  /** The package folder relative to the repository root (`packages/commerce/money`). */
  readonly dir: string;
  /** The folder on the repository host (`https://github.com/<owner>/<repo>/tree/main/<dir>`), from `repository`. */
  readonly sourceUrl: string;
  /** The entries of `exports`, `.` first and the rest sorted by subpath. */
  readonly entries: readonly ApiEntry[];
}
