/**
 * Stackra file contract:
 * Purpose: `OwnMacro`, one macro class of a service and the path it is imported from, as the merged `Blueprint`
 *          augmentation lists it.
 * Boundary: a type only; filled by `compileMigrations`, read by `emitBlueprintMacros`.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 as amended by ADR 0305 (a macro is `<Name>Macro` in `<name>.macro.ts`).
 */

/** One own macro class and where it is imported from. */
export interface OwnMacro {
  /** The class name, `RetentionMacro`. */
  readonly name: string;

  /** The path, `#modules/compliance/database/macros/retention.macro`. */
  readonly from: string;
}
