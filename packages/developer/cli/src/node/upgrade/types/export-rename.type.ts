/**
 * Stackra file contract:
 * Purpose: `ExportRename`, one export a release moved to another module or renamed: the old name, the modules that
 *          exported it, the module that exports it now and its new name. `stackra upgrade` rewrites the imports and
 *          re-exports of a consumer's source from it (`renameExports`).
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); STA-145.
 */

/** An export that moved, was renamed, or both. */
export type ExportRename = {
  /** The exported name before the release, such as `DeviceSession`. */
  readonly name: string;

  /** Every module specifier that exported it before, such as `@stackra/identity/contracts`. */
  readonly from: readonly string[];

  /** The module specifier that exports it now; one of `from` when only the name changed. */
  readonly to: string;

  /** The new exported name, when the name changed. */
  readonly rename?: string;
};
