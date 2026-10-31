/**
 * Stackra file contract:
 * Purpose: `AppSpec`, what the `create` scaffolder writes an app from: its package name, binary, accent, and the
 *          dependency specs of the Stackra packages (registry versions, or packed tarballs for verification).
 * Boundary: a type only.
 * Runtime: node
 * Governing contract: STA-1730 spec FR-029 and FR-031.
 */

/** The answers and specs of one generated app. */
export interface AppSpec {
  /** The package name. */
  readonly name: string;

  /** The binary name. */
  readonly bin: string;

  /** The theme's accent, `#rrggbb`. */
  readonly accent: string;

  /** Dependency spec by Stackra package name (`@stackra/console` → `0.1.0` or `file:/…/stackra-console-0.1.0.tgz`). */
  readonly stackra: Readonly<Record<string, string>>;

  /** Pin every `@stackra/*` package to `stackra` through the package manager's overrides (tarball runs). */
  readonly override: boolean;
}
