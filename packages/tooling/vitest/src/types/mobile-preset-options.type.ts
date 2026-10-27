/**
 * Stackra file contract:
 * Purpose: `MobilePresetOptions`, the options of `mobilePreset`.
 * Boundary: a type only.
 * Runtime: node
 * Governing contract: ADR 0005 (legacy decorators); ADR 0022 (test placement); ADR 0295 (decision 5: generated tool
 *                     configs).
 */
/** Options of `mobilePreset`. */
export interface MobilePresetOptions {
  /** The app root (the folder above `.stackra/`). */
  root: string;
}
