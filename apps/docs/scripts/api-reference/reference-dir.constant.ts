/**
 * Stackra file contract:
 * Purpose: `REFERENCE_DIR`, the folder of the generated reference pages under `src/docs`.
 * Boundary: a constant only; every `.mdx` in the folder is generated.
 * Runtime: node
 * Governing contract: STA-2857.
 */

/** The folder of the reference pages, relative to `src/docs`; every `.mdx` in it is generated. */
export const REFERENCE_DIR = "customers/reference";
