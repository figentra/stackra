/**
 * Stackra file contract:
 * Purpose: `DEV_FACTS_PATH`, where `stackra dev` writes the resolved dev facts, relative to the repository root:
 *          `.stackra/dev/ports.json`. The readers find it by walking up from the working directory.
 * Boundary: a path only; the file is gitignored and machine-local (it carries the lane's ports).
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 1), ADR 0295 (decision 5).
 */

/** The dev facts file, relative to the repository root. */
export const DEV_FACTS_PATH = ".stackra/dev/ports.json";
