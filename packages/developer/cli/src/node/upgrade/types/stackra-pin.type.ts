/**
 * Stackra file contract:
 * Purpose: `StackraPin`, one `@stackra/*` version a workspace pins: in a package.json dependency map or a
 *          pnpm-workspace.yaml catalog or override.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); ADR 0177 (decision 5: one fixed `@stackra/*` version); STA-145.
 */

/** A pinned `@stackra/*` version. */
export type StackraPin = {
  /** The file, relative to the workspace root. */
  readonly file: string;

  /** The package, such as `@stackra/actions`. */
  readonly name: string;

  /** The version, without its `^`, `~` or `=` prefix. */
  readonly version: string;
};
