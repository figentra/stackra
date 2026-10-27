/**
 * Stackra file contract:
 * Purpose: `ServicePresetOptions`, the options of `servicePreset`.
 * Boundary: a type only.
 * Runtime: node
 * Governing contract: ADR 0005 (legacy decorators); ADR 0022 (test placement); ADR 0295 (decision 5: generated tool
 *                     configs).
 */
/** Options of `servicePreset`. */
export interface ServicePresetOptions {
  /** The member root: the folder above `.stackra/`. */
  root: string;
  /** Extra globs no project runs. */
  exclude?: string[];
}
