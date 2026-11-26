/**
 * Stackra file contract:
 * Purpose: `ApiEntry`, one `exports` entry of a package: its import path, the file it maps to and, for a TypeScript
 *          entry, its exported symbols.
 * Boundary: data only; `listPackages` and `readPackageApis` fill it and the renderers read it.
 * Runtime: node
 * Governing contract: ADR 0453 (amendment 2026-10-27: the stackra package fields); STA-2857.
 */
import type { ApiSymbol } from "#scripts/api-reference/api-symbol.type";

/** One `exports` entry of a package. */
export interface ApiEntry {
  /** The subpath as `package.json` writes it: `.`, `./contracts`, `./assets/*`. */
  readonly subpath: string;
  /** `code` for a TypeScript source entry, `file` for assets, JSON presets and other files. */
  readonly kind: "code" | "file";
  /** The file the entry maps to, relative to the package folder (`./src/core/index.ts`, `./assets/*`). */
  readonly target: string;
  /** The exported symbols, sorted by name; empty for a `file` entry. */
  readonly symbols: readonly ApiSymbol[];
}
