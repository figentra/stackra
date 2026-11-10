/**
 * Stackra file contract:
 * Purpose: `DevSecretsPlan`, what `planDevSecrets` decides: the file's next values and the names it generated or
 *          copied, or a refusal when nothing is missing.
 * Boundary: type only. `values` holds values and never leaves the command except into the file.
 * Runtime: node
 * Governing contract: ADR 0525 (amendment of 2026-11-10); STA-2679.
 */

/** The outcome of one init. */
export type DevSecretsPlan =
  | {
      readonly refused: false;
      /** The file's next content, by name. */
      readonly values: Readonly<Record<string, string>>;
      /** The names given a new random value. */
      readonly generated: readonly string[];
      /** The names copied from `--from`. */
      readonly copied: readonly string[];
    }
  | { readonly refused: true };
