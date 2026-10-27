/**
 * Stackra file contract:
 * Purpose: `LOGIN_DIRECTORY_CONFIG_SCHEMA`, the zod schema this package ships for `LoginDirectoryConfig` (exported as
 *          `LoginDirectoryConfig$`): the writing region's key, the active hash key id and the hash key.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults; empty means not configured, and the writer refuses to start. The region and key id hold no
 *           `:` (they are parts of a directory key). The key is the `IDENTITY_LOGIN_DIRECTORY_KEY` secret, never a
 *           value. The defaults equal `LoginDirectoryOptions`' initializers.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0173 (secrets are names); ADR 0353 (decision 1: region keys);
 *                     ADR 0451.
 */
import { z } from "zod";

/** A part of a directory key: empty (unset) or a short token without `:`. */
const KEY_PART = z.string().regex(/^[a-z0-9-]{0,32}$/);

/** The shipped `LoginDirectoryConfig$`. */
export const LOGIN_DIRECTORY_CONFIG_SCHEMA = z.object({
  region: KEY_PART.default(""),
  keyId: KEY_PART.default(""),
  secret: z.string().default(""),
});
