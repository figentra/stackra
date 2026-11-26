/**
 * Stackra file contract:
 * Purpose: `TYPECHECK_TSCONFIG`, the path of the tsconfig gen writes for a service's typecheck: the member's tsconfig
 *          with no `paths`. The member's `paths` exist for Encore, which ignores package.json `imports`, but tsc applies
 *          them program-wide, so a compiled workspace package's own `#` subpaths would resolve into the service's
 *          folders (notify#71); without them each package's `#` imports resolve through its own package.json.
 * Boundary: one spelling, read by the tool-config emitter and by the CLI's typecheck run.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decision 5: gen writes every tool file into `.stackra/`); ADR 0091 (amendment of
 *                     2026-11-09, rule 4 as corrected 2026-11-10); STA-2681.
 */

/** The member-root path of a service's typecheck tsconfig. */
export const TYPECHECK_TSCONFIG = ".stackra/tsconfig.typecheck.json";
