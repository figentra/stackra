/**
 * Stackra file contract:
 * Purpose: `StructureGroup`, one v3 group folder (ADR 0294 decisions 13 and 14): the folder under a module or an app's
 *          `src/` and the kind suffixes whose one home it is.
 * Boundary: type only; `MODULE_GROUPS` and `APP_GROUPS` are its values.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 13 and 14).
 */

/** A v3 group folder and the kinds it holds. */
export type StructureGroup = {
  /** The folder path inside the scope; "" for the scope's root. */
  readonly group: string;

  /** The kind suffixes it holds; empty for function kinds with no suffix. */
  readonly suffixes: readonly string[];

  /** One line saying what it holds. */
  readonly reason: string;

  /** The ADR decision it comes from. */
  readonly adr: string;
};
