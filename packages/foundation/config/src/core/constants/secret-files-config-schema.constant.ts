/**
 * Stackra file contract:
 * Purpose: `SECRET_FILES_CONFIG_SCHEMA`, the zod schema this package ships for `SecretFilesConfig` (exported as
 *          `SecretFilesConfig$`): the folder of mounted secret files and, optionally, the names read from it.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults; they equal `SecretFilesOptions`' initializers (tested). A path and names, never a value.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0371 (amendment 2026-11-27).
 */
import { z } from "zod";

/** The shipped `SecretFilesConfig$`. */
export const SECRET_FILES_CONFIG_SCHEMA = z.object({
  directory: z.string().default(""),
  names: z
    .array(z.string().regex(/^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/, "a SCREAMING_SNAKE secret name"))
    .default(() => []),
});
