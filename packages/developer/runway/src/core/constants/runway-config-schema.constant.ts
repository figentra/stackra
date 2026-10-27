/**
 * Stackra file contract:
 * Purpose: `RunwayConfig$`, the shipped schema of `RunwayOptions`: the Encore Cloud app id and working tree and the
 *          mobile and docs app folders, defaulted.
 * Boundary: authored until gen compiles `RunwayOptions` into `#stackra/schemas` (STA-339); mirrors the shape field
 *           for field, so `.parse({})` gives the defaults. A folder is relative and never climbs out of the repository.
 * Runtime: isomorphic
 * Governing contract: ADR 0352 (decision 3); ADR 0294 (decision 26).
 */
import { z } from "zod";

/** A folder relative to the repository root that never climbs out of it. */
const FOLDER = z
  .string()
  .regex(
    /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9._/-]*$/,
    "Expected a folder inside the repository",
  );

// shortcut: authored until gen compiles this package's RunwayOptions into #stackra/schemas; replace with STA-339.
/** The shipped `RunwayConfig$`. */
export const RunwayConfig$ = z.object({
  encoreApp: z
    .string()
    .regex(/^(|[a-z0-9][a-z0-9-]*)$/, "Expected empty or an Encore Cloud app id")
    .default(""),
  encoreCwd: FOLDER.default(""),
  easProjectDir: FOLDER.default("apps/mobile"),
  mintlifyProjectDir: FOLDER.default("apps/docs"),
});
